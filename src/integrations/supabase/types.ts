export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      ai_chat_files: {
        Row: {
          created_at: string
          expires_at: string
          file_name: string
          file_path: string
          file_size: number
          file_type: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          expires_at?: string
          file_name: string
          file_path: string
          file_size: number
          file_type: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string
          file_name?: string
          file_path?: string
          file_size?: number
          file_type?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      ai_conversations: {
        Row: {
          content: string
          created_at: string
          id: string
          message_type: string
          metadata: Json | null
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          message_type: string
          metadata?: Json | null
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          message_type?: string
          metadata?: Json | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_conversations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "app_users"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_global_knowledge: {
        Row: {
          category: string
          confidence_score: number | null
          corrected_info: string
          created_at: string
          id: string
          knowledge_type: string
          metadata: Json | null
          original_info: string
          updated_at: string
        }
        Insert: {
          category: string
          confidence_score?: number | null
          corrected_info: string
          created_at?: string
          id?: string
          knowledge_type: string
          metadata?: Json | null
          original_info: string
          updated_at?: string
        }
        Update: {
          category?: string
          confidence_score?: number | null
          corrected_info?: string
          created_at?: string
          id?: string
          knowledge_type?: string
          metadata?: Json | null
          original_info?: string
          updated_at?: string
        }
        Relationships: []
      }
      ai_user_profiles: {
        Row: {
          created_at: string
          dietary_preferences: Json | null
          goals: Json | null
          habits: Json | null
          id: string
          last_nutrition_advice: Json | null
          learned_corrections: Json | null
          medical_conditions: Json | null
          preferences: Json | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          dietary_preferences?: Json | null
          goals?: Json | null
          habits?: Json | null
          id?: string
          last_nutrition_advice?: Json | null
          learned_corrections?: Json | null
          medical_conditions?: Json | null
          preferences?: Json | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          dietary_preferences?: Json | null
          goals?: Json | null
          habits?: Json | null
          id?: string
          last_nutrition_advice?: Json | null
          learned_corrections?: Json | null
          medical_conditions?: Json | null
          preferences?: Json | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_user_profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "app_users"
            referencedColumns: ["id"]
          },
        ]
      }
      anthropometric_measurements: {
        Row: {
          arm_circumference: number | null
          body_fat_percentage: number | null
          chest_circumference: number | null
          created_at: string | null
          height: number | null
          hip_circumference: number | null
          id: string
          muscle_mass_percentage: number | null
          test_id: string | null
          thigh_circumference: number | null
          updated_at: string | null
          waist_circumference: number | null
          weight: number | null
        }
        Insert: {
          arm_circumference?: number | null
          body_fat_percentage?: number | null
          chest_circumference?: number | null
          created_at?: string | null
          height?: number | null
          hip_circumference?: number | null
          id?: string
          muscle_mass_percentage?: number | null
          test_id?: string | null
          thigh_circumference?: number | null
          updated_at?: string | null
          waist_circumference?: number | null
          weight?: number | null
        }
        Update: {
          arm_circumference?: number | null
          body_fat_percentage?: number | null
          chest_circumference?: number | null
          created_at?: string | null
          height?: number | null
          hip_circumference?: number | null
          id?: string
          muscle_mass_percentage?: number | null
          test_id?: string | null
          thigh_circumference?: number | null
          updated_at?: string | null
          waist_circumference?: number | null
          weight?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "anthropometric_measurements_test_id_fkey"
            columns: ["test_id"]
            isOneToOne: false
            referencedRelation: "tests"
            referencedColumns: ["id"]
          },
        ]
      }
      anthropometric_test_data: {
        Row: {
          arm_circumference: number | null
          body_fat_percentage: number | null
          chest_circumference: number | null
          created_at: string | null
          height: number | null
          hip_circumference: number | null
          id: string
          muscle_mass_percentage: number | null
          test_session_id: string | null
          thigh_circumference: number | null
          updated_at: string | null
          waist_circumference: number | null
          weight: number | null
        }
        Insert: {
          arm_circumference?: number | null
          body_fat_percentage?: number | null
          chest_circumference?: number | null
          created_at?: string | null
          height?: number | null
          hip_circumference?: number | null
          id?: string
          muscle_mass_percentage?: number | null
          test_session_id?: string | null
          thigh_circumference?: number | null
          updated_at?: string | null
          waist_circumference?: number | null
          weight?: number | null
        }
        Update: {
          arm_circumference?: number | null
          body_fat_percentage?: number | null
          chest_circumference?: number | null
          created_at?: string | null
          height?: number | null
          hip_circumference?: number | null
          id?: string
          muscle_mass_percentage?: number | null
          test_session_id?: string | null
          thigh_circumference?: number | null
          updated_at?: string | null
          waist_circumference?: number | null
          weight?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "anthropometric_test_data_test_session_id_fkey"
            columns: ["test_session_id"]
            isOneToOne: false
            referencedRelation: "anthropometric_test_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_anthropometric_test_data_session"
            columns: ["test_session_id"]
            isOneToOne: false
            referencedRelation: "test_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      anthropometric_test_sessions: {
        Row: {
          created_at: string | null
          created_by: string | null
          id: string
          notes: string | null
          test_date: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          notes?: string | null
          test_date?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          notes?: string | null
          test_date?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "anthropometric_test_sessions_athlete_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "app_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "anthropometric_test_sessions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "app_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "anthropometric_test_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "app_users"
            referencedColumns: ["id"]
          },
        ]
      }
      app_users: {
        Row: {
          auth_user_id: string | null
          birth_date: string | null
          category: string | null
          created_at: string | null
          email: string
          id: string
          name: string
          phone: string | null
          photo_url: string | null
          qr_code: string | null
          role: string
          subscription_status: string | null
          updated_at: string | null
          user_status: string
        }
        Insert: {
          auth_user_id?: string | null
          birth_date?: string | null
          category?: string | null
          created_at?: string | null
          email: string
          id?: string
          name: string
          phone?: string | null
          photo_url?: string | null
          qr_code?: string | null
          role: string
          subscription_status?: string | null
          updated_at?: string | null
          user_status?: string
        }
        Update: {
          auth_user_id?: string | null
          birth_date?: string | null
          category?: string | null
          created_at?: string | null
          email?: string
          id?: string
          name?: string
          phone?: string | null
          photo_url?: string | null
          qr_code?: string | null
          role?: string
          subscription_status?: string | null
          updated_at?: string | null
          user_status?: string
        }
        Relationships: []
      }
      articles: {
        Row: {
          bibliography: string | null
          content_el: string
          content_en: string | null
          created_at: string
          created_by: string | null
          excerpt_el: string
          excerpt_en: string | null
          id: string
          image_url: string | null
          published_date: string
          scheduled_date: string | null
          status: string
          title_el: string
          title_en: string | null
          updated_at: string
        }
        Insert: {
          bibliography?: string | null
          content_el: string
          content_en?: string | null
          created_at?: string
          created_by?: string | null
          excerpt_el: string
          excerpt_en?: string | null
          id?: string
          image_url?: string | null
          published_date?: string
          scheduled_date?: string | null
          status?: string
          title_el: string
          title_en?: string | null
          updated_at?: string
        }
        Update: {
          bibliography?: string | null
          content_el?: string
          content_en?: string | null
          created_at?: string
          created_by?: string | null
          excerpt_el?: string
          excerpt_en?: string | null
          id?: string
          image_url?: string | null
          published_date?: string
          scheduled_date?: string | null
          status?: string
          title_el?: string
          title_en?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      assignment_attendance: {
        Row: {
          assignment_id: string
          attendance_percentage: number | null
          completed_workouts: number
          id: string
          last_updated: string
          makeup_workouts: number
          missed_workouts: number
          total_scheduled_workouts: number
          user_id: string
        }
        Insert: {
          assignment_id: string
          attendance_percentage?: number | null
          completed_workouts?: number
          id?: string
          last_updated?: string
          makeup_workouts?: number
          missed_workouts?: number
          total_scheduled_workouts?: number
          user_id: string
        }
        Update: {
          assignment_id?: string
          attendance_percentage?: number | null
          completed_workouts?: number
          id?: string
          last_updated?: string
          makeup_workouts?: number
          missed_workouts?: number
          total_scheduled_workouts?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "assignment_attendance_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: true
            referencedRelation: "program_assignments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assignment_attendance_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "app_users"
            referencedColumns: ["id"]
          },
        ]
      }
      bookings: {
        Row: {
          created_at: string | null
          description: string | null
          end_time: string
          id: string
          start_time: string
          status: string | null
          title: string
          trainer_id: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          end_time: string
          id?: string
          start_time: string
          status?: string | null
          title: string
          trainer_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          end_time?: string
          id?: string
          start_time?: string
          status?: string | null
          title?: string
          trainer_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bookings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "app_users"
            referencedColumns: ["id"]
          },
        ]
      }
      endurance_test_data: {
        Row: {
          created_at: string | null
          crunches: number | null
          farmer_kg: number | null
          farmer_meters: number | null
          farmer_seconds: number | null
          id: string
          mas_kmh: number | null
          mas_meters: number | null
          mas_minutes: number | null
          mas_ms: number | null
          max_hr: number | null
          pull_ups: number | null
          push_ups: number | null
          resting_hr_1min: number | null
          sprint_meters: number | null
          sprint_resistance: string | null
          sprint_seconds: number | null
          sprint_watt: number | null
          test_session_id: string | null
          updated_at: string | null
          vo2_max: number | null
        }
        Insert: {
          created_at?: string | null
          crunches?: number | null
          farmer_kg?: number | null
          farmer_meters?: number | null
          farmer_seconds?: number | null
          id?: string
          mas_kmh?: number | null
          mas_meters?: number | null
          mas_minutes?: number | null
          mas_ms?: number | null
          max_hr?: number | null
          pull_ups?: number | null
          push_ups?: number | null
          resting_hr_1min?: number | null
          sprint_meters?: number | null
          sprint_resistance?: string | null
          sprint_seconds?: number | null
          sprint_watt?: number | null
          test_session_id?: string | null
          updated_at?: string | null
          vo2_max?: number | null
        }
        Update: {
          created_at?: string | null
          crunches?: number | null
          farmer_kg?: number | null
          farmer_meters?: number | null
          farmer_seconds?: number | null
          id?: string
          mas_kmh?: number | null
          mas_meters?: number | null
          mas_minutes?: number | null
          mas_ms?: number | null
          max_hr?: number | null
          pull_ups?: number | null
          push_ups?: number | null
          resting_hr_1min?: number | null
          sprint_meters?: number | null
          sprint_resistance?: string | null
          sprint_seconds?: number | null
          sprint_watt?: number | null
          test_session_id?: string | null
          updated_at?: string | null
          vo2_max?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "endurance_test_data_test_session_id_fkey"
            columns: ["test_session_id"]
            isOneToOne: false
            referencedRelation: "endurance_test_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_endurance_test_data_session"
            columns: ["test_session_id"]
            isOneToOne: false
            referencedRelation: "test_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      endurance_test_sessions: {
        Row: {
          created_at: string | null
          created_by: string | null
          id: string
          notes: string | null
          test_date: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          notes?: string | null
          test_date?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          notes?: string | null
          test_date?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "endurance_test_sessions_athlete_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "app_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "endurance_test_sessions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "app_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "endurance_test_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "app_users"
            referencedColumns: ["id"]
          },
        ]
      }
      endurance_tests: {
        Row: {
          beep_test_level: number | null
          beep_test_shuttle: number | null
          cooper_test_distance: number | null
          created_at: string | null
          id: string
          max_heart_rate: number | null
          notes: string | null
          recovery_heart_rate: number | null
          resting_heart_rate: number | null
          run_1600m_time: number | null
          test_id: string
          updated_at: string | null
          vo2_max: number | null
        }
        Insert: {
          beep_test_level?: number | null
          beep_test_shuttle?: number | null
          cooper_test_distance?: number | null
          created_at?: string | null
          id?: string
          max_heart_rate?: number | null
          notes?: string | null
          recovery_heart_rate?: number | null
          resting_heart_rate?: number | null
          run_1600m_time?: number | null
          test_id: string
          updated_at?: string | null
          vo2_max?: number | null
        }
        Update: {
          beep_test_level?: number | null
          beep_test_shuttle?: number | null
          cooper_test_distance?: number | null
          created_at?: string | null
          id?: string
          max_heart_rate?: number | null
          notes?: string | null
          recovery_heart_rate?: number | null
          resting_heart_rate?: number | null
          run_1600m_time?: number | null
          test_id?: string
          updated_at?: string | null
          vo2_max?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "endurance_tests_test_id_fkey"
            columns: ["test_id"]
            isOneToOne: false
            referencedRelation: "tests"
            referencedColumns: ["id"]
          },
        ]
      }
      exercise_categories: {
        Row: {
          created_at: string | null
          id: string
          name: string
          type: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          type: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          type?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      exercise_results: {
        Row: {
          actual_kg: string | null
          actual_reps: string | null
          actual_rest: string | null
          actual_sets: number | null
          actual_velocity_ms: string | null
          created_at: string
          id: string
          notes: string | null
          program_exercise_id: string
          updated_at: string
          workout_completion_id: string
        }
        Insert: {
          actual_kg?: string | null
          actual_reps?: string | null
          actual_rest?: string | null
          actual_sets?: number | null
          actual_velocity_ms?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          program_exercise_id: string
          updated_at?: string
          workout_completion_id: string
        }
        Update: {
          actual_kg?: string | null
          actual_reps?: string | null
          actual_rest?: string | null
          actual_sets?: number | null
          actual_velocity_ms?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          program_exercise_id?: string
          updated_at?: string
          workout_completion_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_exercise_results_program_exercise"
            columns: ["program_exercise_id"]
            isOneToOne: false
            referencedRelation: "program_exercises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_exercise_results_workout_completion"
            columns: ["workout_completion_id"]
            isOneToOne: false
            referencedRelation: "workout_completions"
            referencedColumns: ["id"]
          },
        ]
      }
      exercise_to_category: {
        Row: {
          category_id: string
          exercise_id: string
        }
        Insert: {
          category_id: string
          exercise_id: string
        }
        Update: {
          category_id?: string
          exercise_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "exercise_to_category_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "exercise_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exercise_to_category_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          },
        ]
      }
      exercises: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          name: string
          updated_at: string | null
          video_url: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          updated_at?: string | null
          video_url?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          updated_at?: string | null
          video_url?: string | null
        }
        Relationships: []
      }
      expenses: {
        Row: {
          amount: number
          category: string | null
          created_at: string
          created_by: string | null
          description: string
          expense_date: string
          expense_number: string
          id: string
          receipt_number: string | null
          updated_at: string
        }
        Insert: {
          amount: number
          category?: string | null
          created_at?: string
          created_by?: string | null
          description: string
          expense_date?: string
          expense_number: string
          id?: string
          receipt_number?: string | null
          updated_at?: string
        }
        Update: {
          amount?: number
          category?: string | null
          created_at?: string
          created_by?: string | null
          description?: string
          expense_date?: string
          expense_number?: string
          id?: string
          receipt_number?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      functional_assessments: {
        Row: {
          assessment_type: string | null
          created_at: string | null
          id: string
          notes: string | null
          risk_level: string | null
          score: number | null
          test_id: string | null
          updated_at: string | null
        }
        Insert: {
          assessment_type?: string | null
          created_at?: string | null
          id?: string
          notes?: string | null
          risk_level?: string | null
          score?: number | null
          test_id?: string | null
          updated_at?: string | null
        }
        Update: {
          assessment_type?: string | null
          created_at?: string | null
          id?: string
          notes?: string | null
          risk_level?: string | null
          score?: number | null
          test_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "functional_assessments_test_id_fkey"
            columns: ["test_id"]
            isOneToOne: false
            referencedRelation: "tests"
            referencedColumns: ["id"]
          },
        ]
      }
      functional_test_data: {
        Row: {
          created_at: string | null
          flamingo_balance: number | null
          fms_detailed_scores: Json | null
          fms_score: number | null
          id: string
          muscles_need_strengthening: string[] | null
          muscles_need_stretching: string[] | null
          posture_assessment: string | null
          posture_issues: string[] | null
          shoulder_mobility_left: number | null
          shoulder_mobility_right: number | null
          single_leg_squat_issues: string[] | null
          sit_and_reach: number | null
          squat_issues: string[] | null
          test_session_id: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          flamingo_balance?: number | null
          fms_detailed_scores?: Json | null
          fms_score?: number | null
          id?: string
          muscles_need_strengthening?: string[] | null
          muscles_need_stretching?: string[] | null
          posture_assessment?: string | null
          posture_issues?: string[] | null
          shoulder_mobility_left?: number | null
          shoulder_mobility_right?: number | null
          single_leg_squat_issues?: string[] | null
          sit_and_reach?: number | null
          squat_issues?: string[] | null
          test_session_id?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          flamingo_balance?: number | null
          fms_detailed_scores?: Json | null
          fms_score?: number | null
          id?: string
          muscles_need_strengthening?: string[] | null
          muscles_need_stretching?: string[] | null
          posture_assessment?: string | null
          posture_issues?: string[] | null
          shoulder_mobility_left?: number | null
          shoulder_mobility_right?: number | null
          single_leg_squat_issues?: string[] | null
          sit_and_reach?: number | null
          squat_issues?: string[] | null
          test_session_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_functional_test_data_session"
            columns: ["test_session_id"]
            isOneToOne: false
            referencedRelation: "test_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "functional_test_data_test_session_id_fkey"
            columns: ["test_session_id"]
            isOneToOne: false
            referencedRelation: "functional_test_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      functional_test_sessions: {
        Row: {
          created_at: string | null
          created_by: string | null
          id: string
          notes: string | null
          test_date: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          notes?: string | null
          test_date?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          notes?: string | null
          test_date?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "functional_test_sessions_athlete_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "app_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "functional_test_sessions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "app_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "functional_test_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "app_users"
            referencedColumns: ["id"]
          },
        ]
      }
      functional_tests: {
        Row: {
          created_at: string | null
          flamingo_balance: number | null
          fms_score: number | null
          id: string
          notes: string | null
          posture_assessment: string | null
          shoulder_mobility_left: number | null
          shoulder_mobility_right: number | null
          sit_and_reach: number | null
          test_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          flamingo_balance?: number | null
          fms_score?: number | null
          id?: string
          notes?: string | null
          posture_assessment?: string | null
          shoulder_mobility_left?: number | null
          shoulder_mobility_right?: number | null
          sit_and_reach?: number | null
          test_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          flamingo_balance?: number | null
          fms_score?: number | null
          id?: string
          notes?: string | null
          posture_assessment?: string | null
          shoulder_mobility_left?: number | null
          shoulder_mobility_right?: number | null
          sit_and_reach?: number | null
          test_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "functional_tests_test_id_fkey"
            columns: ["test_id"]
            isOneToOne: false
            referencedRelation: "tests"
            referencedColumns: ["id"]
          },
        ]
      }
      group_assignment_users: {
        Row: {
          created_at: string | null
          group_assignment_id: string
          id: string
          individual_assignment_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          group_assignment_id: string
          id?: string
          individual_assignment_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          group_assignment_id?: string
          id?: string
          individual_assignment_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_assignment_users_group_assignment_id_fkey"
            columns: ["group_assignment_id"]
            isOneToOne: false
            referencedRelation: "program_assignments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "group_assignment_users_individual_assignment_id_fkey"
            columns: ["individual_assignment_id"]
            isOneToOne: false
            referencedRelation: "program_assignments"
            referencedColumns: ["id"]
          },
        ]
      }
      group_members: {
        Row: {
          added_at: string | null
          group_id: string | null
          id: string
          user_id: string | null
        }
        Insert: {
          added_at?: string | null
          group_id?: string | null
          id?: string
          user_id?: string | null
        }
        Update: {
          added_at?: string | null
          group_id?: string | null
          id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "group_members_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "group_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "app_users"
            referencedColumns: ["id"]
          },
        ]
      }
      groups: {
        Row: {
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          name: string
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          name: string
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "groups_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "app_users"
            referencedColumns: ["id"]
          },
        ]
      }
      home_page: {
        Row: {
          content: Json
          created_at: string
          id: string
          updated_at: string
        }
        Insert: {
          content: Json
          created_at?: string
          id?: string
          updated_at?: string
        }
        Update: {
          content?: Json
          created_at?: string
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      jump_test_data: {
        Row: {
          broad_jump: number | null
          counter_movement_jump: number | null
          created_at: string | null
          depth_jump: number | null
          id: string
          non_counter_movement_jump: number | null
          test_session_id: string | null
          triple_jump_left: number | null
          triple_jump_right: number | null
          updated_at: string | null
        }
        Insert: {
          broad_jump?: number | null
          counter_movement_jump?: number | null
          created_at?: string | null
          depth_jump?: number | null
          id?: string
          non_counter_movement_jump?: number | null
          test_session_id?: string | null
          triple_jump_left?: number | null
          triple_jump_right?: number | null
          updated_at?: string | null
        }
        Update: {
          broad_jump?: number | null
          counter_movement_jump?: number | null
          created_at?: string | null
          depth_jump?: number | null
          id?: string
          non_counter_movement_jump?: number | null
          test_session_id?: string | null
          triple_jump_left?: number | null
          triple_jump_right?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_jump_test_data_session"
            columns: ["test_session_id"]
            isOneToOne: false
            referencedRelation: "test_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jump_test_data_test_session_id_fkey"
            columns: ["test_session_id"]
            isOneToOne: false
            referencedRelation: "jump_test_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      jump_test_sessions: {
        Row: {
          created_at: string | null
          created_by: string | null
          id: string
          notes: string | null
          test_date: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          notes?: string | null
          test_date?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          notes?: string | null
          test_date?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "jump_test_sessions_athlete_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "app_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jump_test_sessions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "app_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jump_test_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "app_users"
            referencedColumns: ["id"]
          },
        ]
      }
      jump_tests: {
        Row: {
          countermovement_jump: number | null
          created_at: string | null
          depth_jump: number | null
          id: string
          notes: string | null
          squat_jump: number | null
          standing_long_jump: number | null
          test_id: string
          triple_hop_left: number | null
          triple_hop_right: number | null
          updated_at: string | null
          vertical_jump: number | null
        }
        Insert: {
          countermovement_jump?: number | null
          created_at?: string | null
          depth_jump?: number | null
          id?: string
          notes?: string | null
          squat_jump?: number | null
          standing_long_jump?: number | null
          test_id: string
          triple_hop_left?: number | null
          triple_hop_right?: number | null
          updated_at?: string | null
          vertical_jump?: number | null
        }
        Update: {
          countermovement_jump?: number | null
          created_at?: string | null
          depth_jump?: number | null
          id?: string
          notes?: string | null
          squat_jump?: number | null
          standing_long_jump?: number | null
          test_id?: string
          triple_hop_left?: number | null
          triple_hop_right?: number | null
          updated_at?: string | null
          vertical_jump?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "jump_tests_test_id_fkey"
            columns: ["test_id"]
            isOneToOne: false
            referencedRelation: "tests"
            referencedColumns: ["id"]
          },
        ]
      }
      mas_tests: {
        Row: {
          athlete_id: number | null
          created_at: string | null
          id: number
          notes: string | null
          speed: number
          test_date: string
          updated_at: string | null
        }
        Insert: {
          athlete_id?: number | null
          created_at?: string | null
          id?: number
          notes?: string | null
          speed: number
          test_date?: string
          updated_at?: string | null
        }
        Update: {
          athlete_id?: number | null
          created_at?: string | null
          id?: number
          notes?: string | null
          speed?: number
          test_date?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      memberships: {
        Row: {
          created_at: string | null
          description: string | null
          duration: number
          id: string
          name: string
          price: number
          status: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          duration: number
          id?: string
          name: string
          price: number
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          duration?: number
          id?: string
          name?: string
          price?: number
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      one_rm_tests: {
        Row: {
          athlete_id: number | null
          created_at: string | null
          exercise_id: number | null
          id: number
          notes: string | null
          test_date: string
          updated_at: string | null
          velocity: number | null
          weight: number
        }
        Insert: {
          athlete_id?: number | null
          created_at?: string | null
          exercise_id?: number | null
          id?: number
          notes?: string | null
          test_date?: string
          updated_at?: string | null
          velocity?: number | null
          weight: number
        }
        Update: {
          athlete_id?: number | null
          created_at?: string | null
          exercise_id?: number | null
          id?: number
          notes?: string | null
          test_date?: string
          updated_at?: string | null
          velocity?: number | null
          weight?: number
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount: number
          created_at: string | null
          id: string
          last_four: string | null
          membership_id: string | null
          payment_date: string | null
          payment_method: string | null
          status: string | null
          subscription_duration_months: number | null
          subscription_type_id: string | null
          transaction_id: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string | null
          id?: string
          last_four?: string | null
          membership_id?: string | null
          payment_date?: string | null
          payment_method?: string | null
          status?: string | null
          subscription_duration_months?: number | null
          subscription_type_id?: string | null
          transaction_id?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string | null
          id?: string
          last_four?: string | null
          membership_id?: string | null
          payment_date?: string | null
          payment_method?: string | null
          status?: string | null
          subscription_duration_months?: number | null
          subscription_type_id?: string | null
          transaction_id?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_membership_id_fkey"
            columns: ["membership_id"]
            isOneToOne: false
            referencedRelation: "memberships"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_subscription_type_id_fkey"
            columns: ["subscription_type_id"]
            isOneToOne: false
            referencedRelation: "subscription_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "app_users"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          email: string | null
          full_name: string | null
          id: string
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id: string
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      program_assignments: {
        Row: {
          assigned_by: string | null
          assignment_type: string | null
          created_at: string | null
          end_date: string | null
          group_id: string | null
          id: string
          is_group_assignment: boolean | null
          notes: string | null
          program_id: string | null
          progress: number | null
          start_date: string | null
          status: string | null
          training_dates: string[] | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          assigned_by?: string | null
          assignment_type?: string | null
          created_at?: string | null
          end_date?: string | null
          group_id?: string | null
          id?: string
          is_group_assignment?: boolean | null
          notes?: string | null
          program_id?: string | null
          progress?: number | null
          start_date?: string | null
          status?: string | null
          training_dates?: string[] | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          assigned_by?: string | null
          assignment_type?: string | null
          created_at?: string | null
          end_date?: string | null
          group_id?: string | null
          id?: string
          is_group_assignment?: boolean | null
          notes?: string | null
          program_id?: string | null
          progress?: number | null
          start_date?: string | null
          status?: string | null
          training_dates?: string[] | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_assigned_by"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "app_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_program_assignments_athlete_id"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "app_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_program_assignments_program_id"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "programs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_program_assignments_user_id"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "app_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "program_assignments_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "programs"
            referencedColumns: ["id"]
          },
        ]
      }
      program_blocks: {
        Row: {
          block_order: number
          created_at: string | null
          day_id: string | null
          id: string
          name: string
          updated_at: string | null
        }
        Insert: {
          block_order: number
          created_at?: string | null
          day_id?: string | null
          id?: string
          name: string
          updated_at?: string | null
        }
        Update: {
          block_order?: number
          created_at?: string | null
          day_id?: string | null
          id?: string
          name?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_program_blocks_day_id"
            columns: ["day_id"]
            isOneToOne: false
            referencedRelation: "program_days"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "program_blocks_day_id_fkey"
            columns: ["day_id"]
            isOneToOne: false
            referencedRelation: "program_days"
            referencedColumns: ["id"]
          },
        ]
      }
      program_days: {
        Row: {
          created_at: string | null
          day_number: number
          estimated_duration_minutes: number | null
          id: string
          name: string
          updated_at: string | null
          week_id: string | null
        }
        Insert: {
          created_at?: string | null
          day_number: number
          estimated_duration_minutes?: number | null
          id?: string
          name: string
          updated_at?: string | null
          week_id?: string | null
        }
        Update: {
          created_at?: string | null
          day_number?: number
          estimated_duration_minutes?: number | null
          id?: string
          name?: string
          updated_at?: string | null
          week_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_program_days_week_id"
            columns: ["week_id"]
            isOneToOne: false
            referencedRelation: "program_weeks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "program_days_week_id_fkey"
            columns: ["week_id"]
            isOneToOne: false
            referencedRelation: "program_weeks"
            referencedColumns: ["id"]
          },
        ]
      }
      program_exercises: {
        Row: {
          block_id: string | null
          created_at: string | null
          exercise_id: string | null
          exercise_order: number
          id: string
          kg: string | null
          ms: string | null
          notes: string | null
          percentage_1rm: number | null
          reps: string | null
          rest: string | null
          rm: string | null
          sets: number
          tempo: string | null
          updated_at: string | null
          velocity_ms: number | null
        }
        Insert: {
          block_id?: string | null
          created_at?: string | null
          exercise_id?: string | null
          exercise_order: number
          id?: string
          kg?: string | null
          ms?: string | null
          notes?: string | null
          percentage_1rm?: number | null
          reps?: string | null
          rest?: string | null
          rm?: string | null
          sets: number
          tempo?: string | null
          updated_at?: string | null
          velocity_ms?: number | null
        }
        Update: {
          block_id?: string | null
          created_at?: string | null
          exercise_id?: string | null
          exercise_order?: number
          id?: string
          kg?: string | null
          ms?: string | null
          notes?: string | null
          percentage_1rm?: number | null
          reps?: string | null
          rest?: string | null
          rm?: string | null
          sets?: number
          tempo?: string | null
          updated_at?: string | null
          velocity_ms?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_program_exercises_block_id"
            columns: ["block_id"]
            isOneToOne: false
            referencedRelation: "program_blocks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_program_exercises_exercise_id"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "program_exercises_block_id_fkey"
            columns: ["block_id"]
            isOneToOne: false
            referencedRelation: "program_blocks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "program_exercises_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          },
        ]
      }
      program_types: {
        Row: {
          created_at: string | null
          description: string | null
          id: number
          name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: number
          name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: number
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      program_weeks: {
        Row: {
          created_at: string | null
          id: string
          name: string
          program_id: string | null
          updated_at: string | null
          week_number: number
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          program_id?: string | null
          updated_at?: string | null
          week_number: number
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          program_id?: string | null
          updated_at?: string | null
          week_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "fk_program_weeks_program_id"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "programs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "program_weeks_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "programs"
            referencedColumns: ["id"]
          },
        ]
      }
      programs: {
        Row: {
          created_at: string | null
          created_by: string | null
          description: string | null
          duration: number | null
          id: string
          is_template: boolean | null
          name: string
          start_date: string | null
          status: string | null
          training_days: number | null
          type: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          duration?: number | null
          id?: string
          is_template?: boolean | null
          name: string
          start_date?: string | null
          status?: string | null
          training_days?: number | null
          type?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          duration?: number | null
          id?: string
          is_template?: boolean | null
          name?: string
          start_date?: string | null
          status?: string | null
          training_days?: number | null
          type?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_programs_athlete_id"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "app_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_programs_created_by"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "app_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "programs_athlete_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "app_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "programs_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "app_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "programs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "app_users"
            referencedColumns: ["id"]
          },
        ]
      }
      receipts: {
        Row: {
          created_at: string
          created_by: string | null
          customer_email: string | null
          customer_name: string
          customer_vat: string | null
          id: string
          invoice_mark: string | null
          issue_date: string
          items: Json
          mydata_id: string | null
          mydata_status: string
          receipt_number: string
          subtotal: number
          total: number
          updated_at: string
          user_id: string | null
          vat: number
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          customer_email?: string | null
          customer_name: string
          customer_vat?: string | null
          id?: string
          invoice_mark?: string | null
          issue_date?: string
          items?: Json
          mydata_id?: string | null
          mydata_status?: string
          receipt_number: string
          subtotal?: number
          total?: number
          updated_at?: string
          user_id?: string | null
          vat?: number
        }
        Update: {
          created_at?: string
          created_by?: string | null
          customer_email?: string | null
          customer_name?: string
          customer_vat?: string | null
          id?: string
          invoice_mark?: string | null
          issue_date?: string
          items?: Json
          mydata_id?: string | null
          mydata_status?: string
          receipt_number?: string
          subtotal?: number
          total?: number
          updated_at?: string
          user_id?: string | null
          vat?: number
        }
        Relationships: [
          {
            foreignKeyName: "receipts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "app_users"
            referencedColumns: ["id"]
          },
        ]
      }
      results: {
        Row: {
          content_el: string
          content_en: string | null
          created_at: string | null
          created_by: string | null
          hashtags: string | null
          id: string
          image_url: string | null
          result_date: string
          status: string
          title_el: string
          title_en: string | null
          updated_at: string | null
        }
        Insert: {
          content_el: string
          content_en?: string | null
          created_at?: string | null
          created_by?: string | null
          hashtags?: string | null
          id?: string
          image_url?: string | null
          result_date?: string
          status?: string
          title_el: string
          title_en?: string | null
          updated_at?: string | null
        }
        Update: {
          content_el?: string
          content_en?: string | null
          created_at?: string | null
          created_by?: string | null
          hashtags?: string | null
          id?: string
          image_url?: string | null
          result_date?: string
          status?: string
          title_el?: string
          title_en?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      site_images: {
        Row: {
          created_at: string
          id: string
          images: Json
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          images: Json
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          images?: Json
          updated_at?: string
        }
        Relationships: []
      }
      site_sections: {
        Row: {
          content: string | null
          created_at: string
          id: string
          section_name: string
          title: string | null
          updated_at: string
        }
        Insert: {
          content?: string | null
          created_at?: string
          id?: string
          section_name: string
          title?: string | null
          updated_at?: string
        }
        Update: {
          content?: string | null
          created_at?: string
          id?: string
          section_name?: string
          title?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      site_settings: {
        Row: {
          created_at: string
          id: string
          settings: Json
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          settings: Json
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          settings?: Json
          updated_at?: string
        }
        Relationships: []
      }
      strength_test_attempts: {
        Row: {
          attempt_number: number
          created_at: string | null
          exercise_id: string | null
          id: string
          is_1rm: boolean | null
          test_session_id: string | null
          updated_at: string | null
          velocity_ms: number | null
          weight_kg: number
        }
        Insert: {
          attempt_number: number
          created_at?: string | null
          exercise_id?: string | null
          id?: string
          is_1rm?: boolean | null
          test_session_id?: string | null
          updated_at?: string | null
          velocity_ms?: number | null
          weight_kg: number
        }
        Update: {
          attempt_number?: number
          created_at?: string | null
          exercise_id?: string | null
          id?: string
          is_1rm?: boolean | null
          test_session_id?: string | null
          updated_at?: string | null
          velocity_ms?: number | null
          weight_kg?: number
        }
        Relationships: [
          {
            foreignKeyName: "strength_test_attempts_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "strength_test_attempts_test_session_id_fkey"
            columns: ["test_session_id"]
            isOneToOne: false
            referencedRelation: "strength_test_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      strength_test_data: {
        Row: {
          attempt_number: number
          created_at: string | null
          exercise_id: string
          id: string
          is_1rm: boolean | null
          notes: string | null
          test_session_id: string | null
          updated_at: string | null
          velocity_ms: number | null
          weight_kg: number | null
        }
        Insert: {
          attempt_number: number
          created_at?: string | null
          exercise_id: string
          id?: string
          is_1rm?: boolean | null
          notes?: string | null
          test_session_id?: string | null
          updated_at?: string | null
          velocity_ms?: number | null
          weight_kg?: number | null
        }
        Update: {
          attempt_number?: number
          created_at?: string | null
          exercise_id?: string
          id?: string
          is_1rm?: boolean | null
          notes?: string | null
          test_session_id?: string | null
          updated_at?: string | null
          velocity_ms?: number | null
          weight_kg?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_strength_test_data_exercise"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_strength_test_data_session"
            columns: ["test_session_id"]
            isOneToOne: false
            referencedRelation: "test_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "strength_test_data_test_session_id_fkey"
            columns: ["test_session_id"]
            isOneToOne: false
            referencedRelation: "test_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      strength_test_sessions: {
        Row: {
          created_at: string | null
          created_by: string | null
          id: string
          notes: string | null
          test_date: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          notes?: string | null
          test_date?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          notes?: string | null
          test_date?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "strength_test_sessions_athlete_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "app_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "strength_test_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "app_users"
            referencedColumns: ["id"]
          },
        ]
      }
      strength_tests: {
        Row: {
          bench_press_1rm: number | null
          created_at: string | null
          deadlift_1rm: number | null
          handgrip_left: number | null
          handgrip_right: number | null
          id: string
          notes: string | null
          plank_time: number | null
          push_ups: number | null
          squat_1rm: number | null
          test_id: string
          updated_at: string | null
          wall_sit_time: number | null
        }
        Insert: {
          bench_press_1rm?: number | null
          created_at?: string | null
          deadlift_1rm?: number | null
          handgrip_left?: number | null
          handgrip_right?: number | null
          id?: string
          notes?: string | null
          plank_time?: number | null
          push_ups?: number | null
          squat_1rm?: number | null
          test_id: string
          updated_at?: string | null
          wall_sit_time?: number | null
        }
        Update: {
          bench_press_1rm?: number | null
          created_at?: string | null
          deadlift_1rm?: number | null
          handgrip_left?: number | null
          handgrip_right?: number | null
          id?: string
          notes?: string | null
          plank_time?: number | null
          push_ups?: number | null
          squat_1rm?: number | null
          test_id?: string
          updated_at?: string | null
          wall_sit_time?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "strength_tests_test_id_fkey"
            columns: ["test_id"]
            isOneToOne: false
            referencedRelation: "tests"
            referencedColumns: ["id"]
          },
        ]
      }
      subscription_types: {
        Row: {
          created_at: string
          description: string | null
          duration_months: number
          features: Json | null
          id: string
          is_active: boolean | null
          name: string
          price: number
          subscription_mode: string
          visit_count: number | null
          visit_expiry_months: number | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          duration_months?: number
          features?: Json | null
          id?: string
          is_active?: boolean | null
          name: string
          price: number
          subscription_mode?: string
          visit_count?: number | null
          visit_expiry_months?: number | null
        }
        Update: {
          created_at?: string
          description?: string | null
          duration_months?: number
          features?: Json | null
          id?: string
          is_active?: boolean | null
          name?: string
          price?: number
          subscription_mode?: string
          visit_count?: number | null
          visit_expiry_months?: number | null
        }
        Relationships: []
      }
      test_categories: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          name: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      test_exercises: {
        Row: {
          created_at: string | null
          exercise_id: string | null
          id: string
          test_id: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          exercise_id?: string | null
          id?: string
          test_id?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          exercise_id?: string | null
          id?: string
          test_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "test_exercises_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "test_exercises_test_id_fkey"
            columns: ["test_id"]
            isOneToOne: false
            referencedRelation: "tests"
            referencedColumns: ["id"]
          },
        ]
      }
      test_results: {
        Row: {
          created_at: string | null
          distance: number | null
          height: number | null
          id: string
          reps: number | null
          result_type: string | null
          speed: number | null
          test_exercise_id: string | null
          time: number | null
          updated_at: string | null
          weight: number | null
        }
        Insert: {
          created_at?: string | null
          distance?: number | null
          height?: number | null
          id?: string
          reps?: number | null
          result_type?: string | null
          speed?: number | null
          test_exercise_id?: string | null
          time?: number | null
          updated_at?: string | null
          weight?: number | null
        }
        Update: {
          created_at?: string | null
          distance?: number | null
          height?: number | null
          id?: string
          reps?: number | null
          result_type?: string | null
          speed?: number | null
          test_exercise_id?: string | null
          time?: number | null
          updated_at?: string | null
          weight?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "test_results_test_exercise_id_fkey"
            columns: ["test_exercise_id"]
            isOneToOne: false
            referencedRelation: "test_exercises"
            referencedColumns: ["id"]
          },
        ]
      }
      test_results_summary: {
        Row: {
          chart_data: Json | null
          created_at: string | null
          id: string
          progress_data: Json | null
          test_date: string
          test_type: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          chart_data?: Json | null
          created_at?: string | null
          id?: string
          progress_data?: Json | null
          test_date: string
          test_type: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          chart_data?: Json | null
          created_at?: string | null
          id?: string
          progress_data?: Json | null
          test_date?: string
          test_type?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "test_results_summary_athlete_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "app_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "test_results_summary_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "app_users"
            referencedColumns: ["id"]
          },
        ]
      }
      test_sessions: {
        Row: {
          completed_at: string | null
          created_at: string
          id: string
          notes: string | null
          session_label: string | null
          test_date: string
          test_types: string[] | null
          updated_at: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          session_label?: string | null
          test_date: string
          test_types?: string[] | null
          updated_at?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          session_label?: string | null
          test_date?: string
          test_types?: string[] | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      test_types: {
        Row: {
          category: string | null
          created_at: string | null
          description: string | null
          id: string
          name: string
          updated_at: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          updated_at?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      tests: {
        Row: {
          created_at: string | null
          created_by: string | null
          date: string
          id: string
          notes: string | null
          test_type: string | null
          test_type_id: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          date: string
          id?: string
          notes?: string | null
          test_type?: string | null
          test_type_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          date?: string
          id?: string
          notes?: string | null
          test_type?: string | null
          test_type_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tests_test_type_id_fkey"
            columns: ["test_type_id"]
            isOneToOne: false
            referencedRelation: "test_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tests_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "app_users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          assigned_by: string | null
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["user_role"]
          user_id: string
        }
        Insert: {
          assigned_by?: string | null
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["user_role"]
          user_id: string
        }
        Update: {
          assigned_by?: string | null
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_subscriptions: {
        Row: {
          archived_at: string | null
          auto_renewal: boolean | null
          created_at: string
          end_date: string
          id: string
          is_paused: boolean | null
          notes: string | null
          paused_at: string | null
          paused_days_remaining: number | null
          payment_id: string | null
          start_date: string
          status: string
          subscription_type_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          archived_at?: string | null
          auto_renewal?: boolean | null
          created_at?: string
          end_date: string
          id?: string
          is_paused?: boolean | null
          notes?: string | null
          paused_at?: string | null
          paused_days_remaining?: number | null
          payment_id?: string | null
          start_date?: string
          status?: string
          subscription_type_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          archived_at?: string | null
          auto_renewal?: boolean | null
          created_at?: string
          end_date?: string
          id?: string
          is_paused?: boolean | null
          notes?: string | null
          paused_at?: string | null
          paused_days_remaining?: number | null
          payment_id?: string | null
          start_date?: string
          status?: string
          subscription_type_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_subscriptions_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_subscriptions_subscription_type_id_fkey"
            columns: ["subscription_type_id"]
            isOneToOne: false
            referencedRelation: "subscription_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "app_users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_visits: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          location: string | null
          notes: string | null
          user_id: string
          visit_date: string
          visit_time: string
          visit_type: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          location?: string | null
          notes?: string | null
          user_id: string
          visit_date?: string
          visit_time?: string
          visit_type?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          location?: string | null
          notes?: string | null
          user_id?: string
          visit_date?: string
          visit_time?: string
          visit_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_user_visits_created_by"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "app_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_user_visits_user_id"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "app_users"
            referencedColumns: ["id"]
          },
        ]
      }
      visit_packages: {
        Row: {
          created_at: string
          expiry_date: string | null
          id: string
          payment_id: string | null
          price: number | null
          purchase_date: string
          remaining_visits: number
          status: string
          total_visits: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          expiry_date?: string | null
          id?: string
          payment_id?: string | null
          price?: number | null
          purchase_date?: string
          remaining_visits: number
          status?: string
          total_visits: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          expiry_date?: string | null
          id?: string
          payment_id?: string | null
          price?: number | null
          purchase_date?: string
          remaining_visits?: number
          status?: string
          total_visits?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_visit_packages_payment_id"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_visit_packages_user_id"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "app_users"
            referencedColumns: ["id"]
          },
        ]
      }
      workout_completions: {
        Row: {
          actual_duration_minutes: number | null
          assignment_id: string
          completed_date: string | null
          created_at: string
          day_number: number
          end_time: string | null
          id: string
          notes: string | null
          program_id: string
          scheduled_date: string
          start_time: string | null
          status: string
          status_color: string | null
          updated_at: string
          user_id: string
          week_number: number
        }
        Insert: {
          actual_duration_minutes?: number | null
          assignment_id: string
          completed_date?: string | null
          created_at?: string
          day_number: number
          end_time?: string | null
          id?: string
          notes?: string | null
          program_id: string
          scheduled_date: string
          start_time?: string | null
          status?: string
          status_color?: string | null
          updated_at?: string
          user_id: string
          week_number: number
        }
        Update: {
          actual_duration_minutes?: number | null
          assignment_id?: string
          completed_date?: string | null
          created_at?: string
          day_number?: number
          end_time?: string | null
          id?: string
          notes?: string | null
          program_id?: string
          scheduled_date?: string
          start_time?: string | null
          status?: string
          status_color?: string | null
          updated_at?: string
          user_id?: string
          week_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "workout_completions_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: false
            referencedRelation: "program_assignments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workout_completions_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "programs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workout_completions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "app_users"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      admin_delete_athlete: {
        Args: { athlete_id: string }
        Returns: undefined
      }
      admin_delete_athlete_memberships: {
        Args: { athlete_id: string }
        Returns: undefined
      }
      check_and_update_expired_subscriptions: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      cleanup_expired_ai_chat_files: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      create_exercise_tables: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      exec_sql: {
        Args: { query: string }
        Returns: Json
      }
      force_delete_athlete: {
        Args: { athlete_id: string }
        Returns: undefined
      }
      get_current_user_role: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_latest_1rm: {
        Args: { athlete_id: string; exercise_id: string }
        Returns: number
      }
      get_suggested_velocity: {
        Args: { athlete_id: string; exercise_id: string; percentage: number }
        Returns: number
      }
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["user_role"]
      }
      has_active_subscription: {
        Args: { user_uuid: string }
        Returns: boolean
      }
      has_role: {
        Args: {
          _user_id: string
          _role: Database["public"]["Enums"]["user_role"]
        }
        Returns: boolean
      }
      pause_subscription: {
        Args: { subscription_id: string }
        Returns: undefined
      }
      record_visit: {
        Args: {
          p_user_id: string
          p_created_by?: string
          p_visit_type?: string
          p_notes?: string
        }
        Returns: string
      }
      renew_subscription: {
        Args: { original_subscription_id: string }
        Returns: string
      }
      resume_subscription: {
        Args: { subscription_id: string }
        Returns: undefined
      }
    }
    Enums: {
      user_role: "admin" | "athlete" | "coach" | "parent" | "general"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      user_role: ["admin", "athlete", "coach", "parent", "general"],
    },
  },
} as const
