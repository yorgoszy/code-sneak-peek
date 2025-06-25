
import { supabase } from '@/integrations/supabase/client';
import { formatDateToLocalString } from '@/utils/dateUtils';
import { assignmentService } from './assignmentService';

export const groupAssignmentService = {
  async assignProgramToGroup(groupId: string, programData: any, trainingDates: string[]) {
    try {
      console.log('🏢 [GroupAssignmentService] Starting group assignment for group:', groupId);

      // 1. Get all members of the group
      const { data: groupMembers, error: membersError } = await supabase
        .from('group_members')
        .select(`
          user_id,
          app_users!inner(id, name, email)
        `)
        .eq('group_id', groupId);

      if (membersError) {
        console.error('❌ Error fetching group members:', membersError);
        throw new Error(`Σφάλμα ανάκτησης μελών ομάδας: ${membersError.message}`);
      }

      if (!groupMembers || groupMembers.length === 0) {
        throw new Error('Η ομάδα δεν έχει μέλη');
      }

      console.log('👥 Group members found:', groupMembers.length);

      // 2. Create the main group assignment
      const groupAssignmentData = {
        program_id: programData.id,
        group_id: groupId,
        training_dates: trainingDates,
        status: 'active',
        assignment_type: 'group',
        is_group_assignment: true,
        start_date: trainingDates[0] || formatDateToLocalString(new Date()),
        end_date: trainingDates[trainingDates.length - 1] || trainingDates[0] || formatDateToLocalString(new Date()),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      console.log('🏢 Creating group assignment:', groupAssignmentData);

      const { data: groupAssignment, error: groupAssignmentError } = await supabase
        .from('program_assignments')
        .insert([groupAssignmentData])
        .select()
        .single();

      if (groupAssignmentError) {
        console.error('❌ Error creating group assignment:', groupAssignmentError);
        throw new Error(`Σφάλμα δημιουργίας ομαδικής ανάθεσης: ${groupAssignmentError.message}`);
      }

      console.log('✅ Group assignment created:', groupAssignment.id);

      // 3. Create individual assignments for each group member
      const individualAssignments = [];
      const groupAssignmentUsers = [];

      for (const member of groupMembers) {
        console.log('👤 Creating individual assignment for user:', member.app_users.name);

        // Create individual assignment
        const individualAssignmentData = {
          program: programData,
          userId: member.user_id,
          trainingDates: trainingDates
        };

        const individualAssignment = await assignmentService.saveAssignment(individualAssignmentData);
        
        if (individualAssignment && individualAssignment.length > 0) {
          individualAssignments.push(individualAssignment[0]);

          // Track the relationship between group assignment and individual assignment
          groupAssignmentUsers.push({
            group_assignment_id: groupAssignment.id,
            user_id: member.user_id,
            individual_assignment_id: individualAssignment[0].id
          });
        }
      }

      // 4. Insert the group assignment users relationships
      if (groupAssignmentUsers.length > 0) {
        const { error: relationshipError } = await supabase
          .from('group_assignment_users')
          .insert(groupAssignmentUsers);

        if (relationshipError) {
          console.error('❌ Error creating group assignment relationships:', relationshipError);
          // Don't throw error here as the assignments are already created
        } else {
          console.log('✅ Group assignment relationships created');
        }
      }

      console.log('🎉 Group assignment completed successfully');
      console.log(`📊 Summary: 1 group assignment, ${individualAssignments.length} individual assignments`);

      return {
        groupAssignment,
        individualAssignments,
        totalMembers: groupMembers.length
      };

    } catch (error) {
      console.error('❌ [GroupAssignmentService] Error in assignProgramToGroup:', error);
      throw error;
    }
  }
};
