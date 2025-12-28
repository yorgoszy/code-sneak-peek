export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      acknowledged_payments: {
        Row: {
          acknowledged_at: string
          admin_user_id: string
          created_at: string
          id: string
          payment_id: string
        }
        Insert: {
          acknowledged_at?: string
          admin_user_id: string
          created_at?: string
          id?: string
          payment_id: string
        }
        Update: {
          acknowledged_at?: string
          admin_user_id?: string
          created_at?: string
          id?: string
          payment_id?: string
        }
        Relationships: []
      }
      acknowledged_users: {
        Row: {
          acknowledged_at: string
          admin_user_id: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          acknowledged_at?: string
          admin_user_id: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          acknowledged_at?: string
          admin_user_id?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "acknowledged_users_admin_user_id_fkey"
            columns: ["admin_user_id"]
            isOneToOne: false
            referencedRelation: "app_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "acknowledged_users_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "app_users"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_notifications: {
        Row: {
          acknowledged_at: string
          admin_user_id: string
          created_at: string
          id: string
          item_id: string
          notification_type: string
        }
        Insert: {
          acknowledged_at?: string
          admin_user_id: string
          created_at?: string
          id?: string
          item_id: string
          notification_type: string
        }
        Update: {
          acknowledged_at?: string
          admin_user_id?: string
          created_at?: string
          id?: string
          item_id?: string
          notification_type?: string
        }
        Relationships: []
      }
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
          workout_stats: Json | null
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
          workout_stats?: Json | null
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
          workout_stats?: Json | null
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
          bone_density: number | null
          chest_circumference: number | null
          created_at: string | null
          height: number | null
          hip_circumference: number | null
          id: string
          muscle_mass_percentage: number | null
          test_session_id: string | null
          thigh_circumference: number | null
          updated_at: string | null
          visceral_fat_percentage: number | null
          waist_circumference: number | null
          weight: number | null
        }
        Insert: {
          arm_circumference?: number | null
          body_fat_percentage?: number | null
          bone_density?: number | null
          chest_circumference?: number | null
          created_at?: string | null
          height?: number | null
          hip_circumference?: number | null
          id?: string
          muscle_mass_percentage?: number | null
          test_session_id?: string | null
          thigh_circumference?: number | null
          updated_at?: string | null
          visceral_fat_percentage?: number | null
          waist_circumference?: number | null
          weight?: number | null
        }
        Update: {
          arm_circumference?: number | null
          body_fat_percentage?: number | null
          bone_density?: number | null
          chest_circumference?: number | null
          created_at?: string | null
          height?: number | null
          hip_circumference?: number | null
          id?: string
          muscle_mass_percentage?: number | null
          test_session_id?: string | null
          thigh_circumference?: number | null
          updated_at?: string | null
          visceral_fat_percentage?: number | null
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
            referencedRelation: "anthropometric_test_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      anthropometric_test_sessions: {
        Row: {
          coach_id: string | null
          created_at: string | null
          created_by: string | null
          id: string
          notes: string | null
          test_date: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          coach_id?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          notes?: string | null
          test_date?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          coach_id?: string | null
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
            foreignKeyName: "anthropometric_test_sessions_coach_id_fkey"
            columns: ["coach_id"]
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
          avatar_url: string | null
          birth_date: string | null
          category: string | null
          child_birth_date: string | null
          coach_id: string | null
          created_at: string | null
          email: string
          gender: string | null
          id: string
          is_athlete: boolean | null
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
          avatar_url?: string | null
          birth_date?: string | null
          category?: string | null
          child_birth_date?: string | null
          coach_id?: string | null
          created_at?: string | null
          email: string
          gender?: string | null
          id?: string
          is_athlete?: boolean | null
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
          avatar_url?: string | null
          birth_date?: string | null
          category?: string | null
          child_birth_date?: string | null
          coach_id?: string | null
          created_at?: string | null
          email?: string
          gender?: string | null
          id?: string
          is_athlete?: boolean | null
          name?: string
          phone?: string | null
          photo_url?: string | null
          qr_code?: string | null
          role?: string
          subscription_status?: string | null
          updated_at?: string | null
          user_status?: string
        }
        Relationships: [
          {
            foreignKeyName: "app_users_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "app_users"
            referencedColumns: ["id"]
          },
        ]
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
      booking_sections: {
        Row: {
          available_hours: Json | null
          created_at: string
          description: string | null
          id: string
          is_active: boolean | null
          max_capacity: number
          name: string
          updated_at: string
        }
        Insert: {
          available_hours?: Json | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          max_capacity?: number
          name: string
          updated_at?: string
        }
        Update: {
          available_hours?: Json | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          max_capacity?: number
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      booking_sessions: {
        Row: {
          attendance_status: string | null
          booking_date: string
          booking_time: string
          booking_type: string
          cancelled_at: string | null
          completed_at: string | null
          created_at: string
          id: string
          meeting_link: string | null
          missed_at: string | null
          notes: string | null
          section_id: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          attendance_status?: string | null
          booking_date: string
          booking_time: string
          booking_type?: string
          cancelled_at?: string | null
          completed_at?: string | null
          created_at?: string
          id?: string
          meeting_link?: string | null
          missed_at?: string | null
          notes?: string | null
          section_id: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          attendance_status?: string | null
          booking_date?: string
          booking_time?: string
          booking_type?: string
          cancelled_at?: string | null
          completed_at?: string | null
          created_at?: string
          id?: string
          meeting_link?: string | null
          missed_at?: string | null
          notes?: string | null
          section_id?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "booking_sessions_section_id_fkey"
            columns: ["section_id"]
            isOneToOne: false
            referencedRelation: "booking_sections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_booking_sessions_user_id"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "app_users"
            referencedColumns: ["id"]
          },
        ]
      }
      booking_waiting_list: {
        Row: {
          booking_date: string
          booking_time: string
          booking_type: string | null
          created_at: string
          id: string
          notified_at: string | null
          position: number
          section_id: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          booking_date: string
          booking_time: string
          booking_type?: string | null
          created_at?: string
          id?: string
          notified_at?: string | null
          position: number
          section_id: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          booking_date?: string
          booking_time?: string
          booking_type?: string | null
          created_at?: string
          id?: string
          notified_at?: string | null
          position?: number
          section_id?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_waiting_list_section"
            columns: ["section_id"]
            isOneToOne: false
            referencedRelation: "booking_sections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_waiting_list_user"
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
      campaign_prizes: {
        Row: {
          campaign_id: string
          created_at: string
          description: string | null
          discount_percentage: number | null
          id: string
          is_active: boolean
          name: string
          prize_type: string
          quantity: number
          remaining_quantity: number
          subscription_type_id: string | null
          updated_at: string
          weight: number
        }
        Insert: {
          campaign_id: string
          created_at?: string
          description?: string | null
          discount_percentage?: number | null
          id?: string
          is_active?: boolean
          name?: string
          prize_type: string
          quantity?: number
          remaining_quantity?: number
          subscription_type_id?: string | null
          updated_at?: string
          weight?: number
        }
        Update: {
          campaign_id?: string
          created_at?: string
          description?: string | null
          discount_percentage?: number | null
          id?: string
          is_active?: boolean
          name?: string
          prize_type?: string
          quantity?: number
          remaining_quantity?: number
          subscription_type_id?: string | null
          updated_at?: string
          weight?: number
        }
        Relationships: [
          {
            foreignKeyName: "campaign_prizes_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "magic_box_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaign_prizes_subscription_type_id_fkey"
            columns: ["subscription_type_id"]
            isOneToOne: false
            referencedRelation: "subscription_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_campaign_prizes_subscription_types"
            columns: ["subscription_type_id"]
            isOneToOne: false
            referencedRelation: "subscription_types"
            referencedColumns: ["id"]
          },
        ]
      }
      children: {
        Row: {
          birth_date: string
          created_at: string
          id: string
          name: string
          parent_id: string
          updated_at: string
        }
        Insert: {
          birth_date: string
          created_at?: string
          id?: string
          name: string
          parent_id: string
          updated_at?: string
        }
        Update: {
          birth_date?: string
          created_at?: string
          id?: string
          name?: string
          parent_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "children_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "app_users"
            referencedColumns: ["id"]
          },
        ]
      }
      competitions: {
        Row: {
          competition_date: string
          created_at: string
          id: string
          location: string | null
          name: string | null
          notes: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          competition_date: string
          created_at?: string
          id?: string
          location?: string | null
          name?: string | null
          notes?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          competition_date?: string
          created_at?: string
          id?: string
          location?: string | null
          name?: string | null
          notes?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "competitions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "app_users"
            referencedColumns: ["id"]
          },
        ]
      }
      corrective_issue_exercises: {
        Row: {
          created_at: string | null
          exercise_id: string
          exercise_type: string
          id: string
          issue_category: string
          issue_name: string
          notes: string | null
          priority: number | null
        }
        Insert: {
          created_at?: string | null
          exercise_id: string
          exercise_type?: string
          id?: string
          issue_category: string
          issue_name: string
          notes?: string | null
          priority?: number | null
        }
        Update: {
          created_at?: string | null
          exercise_id?: string
          exercise_type?: string
          id?: string
          issue_category?: string
          issue_name?: string
          notes?: string | null
          priority?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "corrective_issue_exercises_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          },
        ]
      }
      corrective_muscle_exercises: {
        Row: {
          action_type: string
          created_at: string | null
          exercise_id: string
          id: string
          muscle_id: string
          notes: string | null
          priority: number | null
        }
        Insert: {
          action_type: string
          created_at?: string | null
          exercise_id: string
          id?: string
          muscle_id: string
          notes?: string | null
          priority?: number | null
        }
        Update: {
          action_type?: string
          created_at?: string | null
          exercise_id?: string
          id?: string
          muscle_id?: string
          notes?: string | null
          priority?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "corrective_muscle_exercises_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "corrective_muscle_exercises_muscle_id_fkey"
            columns: ["muscle_id"]
            isOneToOne: false
            referencedRelation: "muscles"
            referencedColumns: ["id"]
          },
        ]
      }
      discount_coupons: {
        Row: {
          code: string
          created_at: string
          discount_percentage: number
          expires_at: string | null
          id: string
          is_used: boolean
          used_at: string | null
          used_in_payment_id: string | null
          user_id: string
        }
        Insert: {
          code: string
          created_at?: string
          discount_percentage: number
          expires_at?: string | null
          id?: string
          is_used?: boolean
          used_at?: string | null
          used_in_payment_id?: string | null
          user_id: string
        }
        Update: {
          code?: string
          created_at?: string
          discount_percentage?: number
          expires_at?: string | null
          id?: string
          is_used?: boolean
          used_at?: string | null
          used_in_payment_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "discount_coupons_user_id_fkey"
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
          exercise_id: string | null
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
          t2b: number | null
          test_session_id: string | null
          updated_at: string | null
          vo2_max: number | null
        }
        Insert: {
          created_at?: string | null
          crunches?: number | null
          exercise_id?: string | null
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
          t2b?: number | null
          test_session_id?: string | null
          updated_at?: string | null
          vo2_max?: number | null
        }
        Update: {
          created_at?: string | null
          crunches?: number | null
          exercise_id?: string | null
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
          t2b?: number | null
          test_session_id?: string | null
          updated_at?: string | null
          vo2_max?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "endurance_test_data_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          },
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
            referencedRelation: "endurance_test_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      endurance_test_sessions: {
        Row: {
          coach_id: string | null
          created_at: string | null
          created_by: string | null
          id: string
          notes: string | null
          test_date: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          coach_id?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          notes?: string | null
          test_date?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          coach_id?: string | null
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
            foreignKeyName: "endurance_test_sessions_coach_id_fkey"
            columns: ["coach_id"]
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
      exercise_notes: {
        Row: {
          assignment_id: string
          created_at: string
          day_number: number
          exercise_id: string
          id: string
          notes: string | null
          updated_at: string
        }
        Insert: {
          assignment_id: string
          created_at?: string
          day_number: number
          exercise_id: string
          id?: string
          notes?: string | null
          updated_at?: string
        }
        Update: {
          assignment_id?: string
          created_at?: string
          day_number?: number
          exercise_id?: string
          id?: string
          notes?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      exercise_relationships: {
        Row: {
          created_at: string
          exercise_id: string
          id: string
          order_index: number | null
          related_exercise_id: string
          relationship_type: string
        }
        Insert: {
          created_at?: string
          exercise_id: string
          id?: string
          order_index?: number | null
          related_exercise_id: string
          relationship_type?: string
        }
        Update: {
          created_at?: string
          exercise_id?: string
          id?: string
          order_index?: number | null
          related_exercise_id?: string
          relationship_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "exercise_relationships_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exercise_relationships_related_exercise_id_fkey"
            columns: ["related_exercise_id"]
            isOneToOne: false
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          },
        ]
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
      exercise_stretches: {
        Row: {
          created_at: string
          exercise_id: string
          id: string
          order_index: number | null
          stretch_id: string
        }
        Insert: {
          created_at?: string
          exercise_id: string
          id?: string
          order_index?: number | null
          stretch_id: string
        }
        Update: {
          created_at?: string
          exercise_id?: string
          id?: string
          order_index?: number | null
          stretch_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "exercise_stretches_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exercise_stretches_stretch_id_fkey"
            columns: ["stretch_id"]
            isOneToOne: false
            referencedRelation: "stretches"
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
          coach_id: string | null
          created_at: string | null
          description: string | null
          id: string
          name: string
          updated_at: string | null
          video_url: string | null
        }
        Insert: {
          coach_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          updated_at?: string | null
          video_url?: string | null
        }
        Update: {
          coach_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          updated_at?: string | null
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "exercises_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "app_users"
            referencedColumns: ["id"]
          },
        ]
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
      foods: {
        Row: {
          calories_per_100g: number
          carbs_per_100g: number
          category: string | null
          created_at: string
          fat_per_100g: number
          fiber_per_100g: number | null
          id: string
          name: string
          portion_size: number | null
          portion_unit: string | null
          protein_per_100g: number
          updated_at: string
        }
        Insert: {
          calories_per_100g?: number
          carbs_per_100g?: number
          category?: string | null
          created_at?: string
          fat_per_100g?: number
          fiber_per_100g?: number | null
          id?: string
          name: string
          portion_size?: number | null
          portion_unit?: string | null
          protein_per_100g?: number
          updated_at?: string
        }
        Update: {
          calories_per_100g?: number
          carbs_per_100g?: number
          category?: string | null
          created_at?: string
          fat_per_100g?: number
          fiber_per_100g?: number | null
          id?: string
          name?: string
          portion_size?: number | null
          portion_unit?: string | null
          protein_per_100g?: number
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
      functional_issue_muscle_mappings: {
        Row: {
          action_type: string
          created_at: string
          dysfunction: string | null
          id: string
          issue_category: string
          issue_name: string
          muscle_id: string
          updated_at: string
        }
        Insert: {
          action_type: string
          created_at?: string
          dysfunction?: string | null
          id?: string
          issue_category: string
          issue_name: string
          muscle_id: string
          updated_at?: string
        }
        Update: {
          action_type?: string
          created_at?: string
          dysfunction?: string | null
          id?: string
          issue_category?: string
          issue_name?: string
          muscle_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "functional_issue_muscle_mappings_muscle_id_fkey"
            columns: ["muscle_id"]
            isOneToOne: false
            referencedRelation: "muscles"
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
          coach_id: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          name: string
        }
        Insert: {
          coach_id?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          name: string
        }
        Update: {
          coach_id?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "groups_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "app_users"
            referencedColumns: ["id"]
          },
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
      magic_box_campaigns: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          end_date: string | null
          id: string
          is_active: boolean
          max_participations_per_user: number | null
          name: string
          start_date: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          is_active?: boolean
          max_participations_per_user?: number | null
          name: string
          start_date?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          is_active?: boolean
          max_participations_per_user?: number | null
          name?: string
          start_date?: string
          updated_at?: string
        }
        Relationships: []
      }
      magic_box_prizes: {
        Row: {
          created_at: string
          discount_percentage: number | null
          id: string
          magic_box_id: string
          prize_type: string
          quantity: number
          subscription_type_id: string | null
        }
        Insert: {
          created_at?: string
          discount_percentage?: number | null
          id?: string
          magic_box_id: string
          prize_type?: string
          quantity?: number
          subscription_type_id?: string | null
        }
        Update: {
          created_at?: string
          discount_percentage?: number | null
          id?: string
          magic_box_id?: string
          prize_type?: string
          quantity?: number
          subscription_type_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "magic_box_prizes_subscription_type_id_fkey"
            columns: ["subscription_type_id"]
            isOneToOne: false
            referencedRelation: "subscription_types"
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
      muscles: {
        Row: {
          created_at: string
          id: string
          mesh_name: string | null
          muscle_group: string | null
          name: string
          position_x: number | null
          position_y: number | null
          position_z: number | null
          texture_url: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          mesh_name?: string | null
          muscle_group?: string | null
          name: string
          position_x?: number | null
          position_y?: number | null
          position_z?: number | null
          texture_url?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          mesh_name?: string | null
          muscle_group?: string | null
          name?: string
          position_x?: number | null
          position_y?: number | null
          position_z?: number | null
          texture_url?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      nutrition_assignments: {
        Row: {
          assigned_by: string | null
          created_at: string
          end_date: string | null
          id: string
          notes: string | null
          plan_id: string
          start_date: string
          status: string | null
          training_dates: string[] | null
          updated_at: string
          user_id: string
        }
        Insert: {
          assigned_by?: string | null
          created_at?: string
          end_date?: string | null
          id?: string
          notes?: string | null
          plan_id: string
          start_date: string
          status?: string | null
          training_dates?: string[] | null
          updated_at?: string
          user_id: string
        }
        Update: {
          assigned_by?: string | null
          created_at?: string
          end_date?: string | null
          id?: string
          notes?: string | null
          plan_id?: string
          start_date?: string
          status?: string | null
          training_dates?: string[] | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "nutrition_assignments_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "app_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "nutrition_assignments_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "nutrition_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "nutrition_assignments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "app_users"
            referencedColumns: ["id"]
          },
        ]
      }
      nutrition_meal_foods: {
        Row: {
          calories: number | null
          carbs: number | null
          created_at: string
          fat: number | null
          food_id: string | null
          food_name: string
          food_order: number | null
          id: string
          meal_id: string
          notes: string | null
          protein: number | null
          quantity: number
          unit: string | null
        }
        Insert: {
          calories?: number | null
          carbs?: number | null
          created_at?: string
          fat?: number | null
          food_id?: string | null
          food_name: string
          food_order?: number | null
          id?: string
          meal_id: string
          notes?: string | null
          protein?: number | null
          quantity?: number
          unit?: string | null
        }
        Update: {
          calories?: number | null
          carbs?: number | null
          created_at?: string
          fat?: number | null
          food_id?: string | null
          food_name?: string
          food_order?: number | null
          id?: string
          meal_id?: string
          notes?: string | null
          protein?: number | null
          quantity?: number
          unit?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "nutrition_meal_foods_food_id_fkey"
            columns: ["food_id"]
            isOneToOne: false
            referencedRelation: "foods"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "nutrition_meal_foods_meal_id_fkey"
            columns: ["meal_id"]
            isOneToOne: false
            referencedRelation: "nutrition_meals"
            referencedColumns: ["id"]
          },
        ]
      }
      nutrition_meals: {
        Row: {
          created_at: string
          day_id: string
          description: string | null
          id: string
          meal_order: number
          meal_type: string
          name: string
          total_calories: number | null
          total_carbs: number | null
          total_fat: number | null
          total_protein: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          day_id: string
          description?: string | null
          id?: string
          meal_order: number
          meal_type: string
          name: string
          total_calories?: number | null
          total_carbs?: number | null
          total_fat?: number | null
          total_protein?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          day_id?: string
          description?: string | null
          id?: string
          meal_order?: number
          meal_type?: string
          name?: string
          total_calories?: number | null
          total_carbs?: number | null
          total_fat?: number | null
          total_protein?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "nutrition_meals_day_id_fkey"
            columns: ["day_id"]
            isOneToOne: false
            referencedRelation: "nutrition_plan_days"
            referencedColumns: ["id"]
          },
        ]
      }
      nutrition_plan_days: {
        Row: {
          created_at: string
          day_number: number
          id: string
          name: string
          plan_id: string
          total_calories: number | null
          total_carbs: number | null
          total_fat: number | null
          total_protein: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          day_number: number
          id?: string
          name: string
          plan_id: string
          total_calories?: number | null
          total_carbs?: number | null
          total_fat?: number | null
          total_protein?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          day_number?: number
          id?: string
          name?: string
          plan_id?: string
          total_calories?: number | null
          total_carbs?: number | null
          total_fat?: number | null
          total_protein?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "nutrition_plan_days_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "nutrition_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      nutrition_plans: {
        Row: {
          carbs_target: number | null
          coach_id: string | null
          created_at: string
          created_by: string | null
          description: string | null
          fat_target: number | null
          goal: string | null
          id: string
          name: string
          protein_target: number | null
          total_daily_calories: number | null
          updated_at: string
        }
        Insert: {
          carbs_target?: number | null
          coach_id?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          fat_target?: number | null
          goal?: string | null
          id?: string
          name: string
          protein_target?: number | null
          total_daily_calories?: number | null
          updated_at?: string
        }
        Update: {
          carbs_target?: number | null
          coach_id?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          fat_target?: number | null
          goal?: string | null
          id?: string
          name?: string
          protein_target?: number | null
          total_daily_calories?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "nutrition_plans_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "app_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "nutrition_plans_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "app_users"
            referencedColumns: ["id"]
          },
        ]
      }
      offer_rejections: {
        Row: {
          id: string
          offer_id: string
          rejected_at: string
          user_id: string
        }
        Insert: {
          id?: string
          offer_id: string
          rejected_at?: string
          user_id: string
        }
        Update: {
          id?: string
          offer_id?: string
          rejected_at?: string
          user_id?: string
        }
        Relationships: []
      }
      offer_responses: {
        Row: {
          created_at: string
          id: string
          offer_id: string
          response: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          offer_id: string
          response: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          offer_id?: string
          response?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      offers: {
        Row: {
          created_at: string | null
          created_by: string | null
          description: string | null
          discounted_price: number
          end_date: string
          id: string
          is_active: boolean | null
          is_free: boolean | null
          name: string
          start_date: string
          subscription_type_id: string | null
          target_groups: string[] | null
          target_users: string[] | null
          updated_at: string | null
          visibility: string
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          discounted_price: number
          end_date: string
          id?: string
          is_active?: boolean | null
          is_free?: boolean | null
          name: string
          start_date: string
          subscription_type_id?: string | null
          target_groups?: string[] | null
          target_users?: string[] | null
          updated_at?: string | null
          visibility?: string
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          discounted_price?: number
          end_date?: string
          id?: string
          is_active?: boolean | null
          is_free?: boolean | null
          name?: string
          start_date?: string
          subscription_type_id?: string | null
          target_groups?: string[] | null
          target_users?: string[] | null
          updated_at?: string | null
          visibility?: string
        }
        Relationships: [
          {
            foreignKeyName: "offers_subscription_type_id_fkey"
            columns: ["subscription_type_id"]
            isOneToOne: false
            referencedRelation: "subscription_types"
            referencedColumns: ["id"]
          },
        ]
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
          offer_id: string | null
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
          offer_id?: string | null
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
          offer_id?: string | null
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
            foreignKeyName: "payments_offer_id_fkey"
            columns: ["offer_id"]
            isOneToOne: false
            referencedRelation: "offers"
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
      phase_exercise_categories: {
        Row: {
          category_id: string
          created_at: string | null
          id: string
          phase_id: string
          priority: number | null
        }
        Insert: {
          category_id: string
          created_at?: string | null
          id?: string
          phase_id: string
          priority?: number | null
        }
        Update: {
          category_id?: string
          created_at?: string | null
          id?: string
          phase_id?: string
          priority?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "phase_exercise_categories_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "exercise_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "phase_exercise_categories_phase_id_fkey"
            columns: ["phase_id"]
            isOneToOne: false
            referencedRelation: "training_phase_config"
            referencedColumns: ["id"]
          },
        ]
      }
      phase_exercises: {
        Row: {
          created_at: string | null
          exercise_id: string
          id: string
          notes: string | null
          phase_id: string
          priority: number | null
        }
        Insert: {
          created_at?: string | null
          exercise_id: string
          id?: string
          notes?: string | null
          phase_id: string
          priority?: number | null
        }
        Update: {
          created_at?: string | null
          exercise_id?: string
          id?: string
          notes?: string | null
          phase_id?: string
          priority?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "phase_exercises_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "phase_exercises_phase_id_fkey"
            columns: ["phase_id"]
            isOneToOne: false
            referencedRelation: "training_phase_config"
            referencedColumns: ["id"]
          },
        ]
      }
      phase_rep_schemes: {
        Row: {
          created_at: string | null
          id: string
          intensity_percent: number | null
          is_primary: boolean | null
          kg: string | null
          kg_mode: string | null
          notes: string | null
          phase_id: string
          reps: string
          reps_mode: string | null
          rest: string | null
          scheme_name: string
          sets: number
          tempo: string | null
          velocity_ms: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          intensity_percent?: number | null
          is_primary?: boolean | null
          kg?: string | null
          kg_mode?: string | null
          notes?: string | null
          phase_id: string
          reps: string
          reps_mode?: string | null
          rest?: string | null
          scheme_name: string
          sets: number
          tempo?: string | null
          velocity_ms?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          intensity_percent?: number | null
          is_primary?: boolean | null
          kg?: string | null
          kg_mode?: string | null
          notes?: string | null
          phase_id?: string
          reps?: string
          reps_mode?: string | null
          rest?: string | null
          scheme_name?: string
          sets?: number
          tempo?: string | null
          velocity_ms?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "phase_rep_schemes_phase_id_fkey"
            columns: ["phase_id"]
            isOneToOne: false
            referencedRelation: "training_phase_config"
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
          coach_id: string | null
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
          coach_id?: string | null
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
          coach_id?: string | null
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
            foreignKeyName: "program_assignments_coach_id_fkey"
            columns: ["coach_id"]
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
          block_sets: number | null
          created_at: string | null
          day_id: string | null
          id: string
          name: string
          training_type: string | null
          updated_at: string | null
          workout_duration: string | null
          workout_format: string | null
        }
        Insert: {
          block_order: number
          block_sets?: number | null
          created_at?: string | null
          day_id?: string | null
          id?: string
          name: string
          training_type?: string | null
          updated_at?: string | null
          workout_duration?: string | null
          workout_format?: string | null
        }
        Update: {
          block_order?: number
          block_sets?: number | null
          created_at?: string | null
          day_id?: string | null
          id?: string
          name?: string
          training_type?: string | null
          updated_at?: string | null
          workout_duration?: string | null
          workout_format?: string | null
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
          is_competition_day: boolean | null
          is_test_day: boolean | null
          name: string
          test_types: string[] | null
          updated_at: string | null
          week_id: string | null
        }
        Insert: {
          created_at?: string | null
          day_number: number
          estimated_duration_minutes?: number | null
          id?: string
          is_competition_day?: boolean | null
          is_test_day?: boolean | null
          name: string
          test_types?: string[] | null
          updated_at?: string | null
          week_id?: string | null
        }
        Update: {
          created_at?: string | null
          day_number?: number
          estimated_duration_minutes?: number | null
          id?: string
          is_competition_day?: boolean | null
          is_test_day?: boolean | null
          name?: string
          test_types?: string[] | null
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
          kg_mode: string | null
          ms: string | null
          notes: string | null
          percentage_1rm: number | null
          reps: string | null
          reps_mode: string | null
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
          kg_mode?: string | null
          ms?: string | null
          notes?: string | null
          percentage_1rm?: number | null
          reps?: string | null
          reps_mode?: string | null
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
          kg_mode?: string | null
          ms?: string | null
          notes?: string | null
          percentage_1rm?: number | null
          reps?: string | null
          reps_mode?: string | null
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
          coach_id: string | null
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
          coach_id?: string | null
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
          coach_id?: string | null
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
            foreignKeyName: "programs_coach_id_fkey"
            columns: ["coach_id"]
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
          coach_id: string | null
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
          payment_id: string | null
          receipt_number: string
          subtotal: number
          total: number
          updated_at: string
          user_id: string | null
          vat: number
        }
        Insert: {
          coach_id?: string | null
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
          payment_id?: string | null
          receipt_number: string
          subtotal?: number
          total?: number
          updated_at?: string
          user_id?: string | null
          vat?: number
        }
        Update: {
          coach_id?: string | null
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
          payment_id?: string | null
          receipt_number?: string
          subtotal?: number
          total?: number
          updated_at?: string
          user_id?: string | null
          vat?: number
        }
        Relationships: [
          {
            foreignKeyName: "receipts_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "app_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "receipts_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
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
      saved_macrocycles: {
        Row: {
          created_at: string
          id: string
          monthly_phases: Json | null
          name: string
          phases: Json
          updated_at: string
          weekly_phases: Json | null
          year: number
        }
        Insert: {
          created_at?: string
          id?: string
          monthly_phases?: Json | null
          name: string
          phases?: Json
          updated_at?: string
          weekly_phases?: Json | null
          year: number
        }
        Update: {
          created_at?: string
          id?: string
          monthly_phases?: Json | null
          name?: string
          phases?: Json
          updated_at?: string
          weekly_phases?: Json | null
          year?: number
        }
        Relationships: []
      }
      school_notes: {
        Row: {
          ai_processed: boolean | null
          ai_summary: string | null
          category: string
          child_age: number | null
          child_id: string | null
          content: string
          created_at: string
          id: string
          parent_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          ai_processed?: boolean | null
          ai_summary?: string | null
          category: string
          child_age?: number | null
          child_id?: string | null
          content: string
          created_at?: string
          id?: string
          parent_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          ai_processed?: boolean | null
          ai_summary?: string | null
          category?: string
          child_age?: number | null
          child_id?: string | null
          content?: string
          created_at?: string
          id?: string
          parent_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "school_notes_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "children"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "school_notes_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "app_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "school_notes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "app_users"
            referencedColumns: ["id"]
          },
        ]
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
      sprint_timing_results: {
        Row: {
          created_at: string
          distance_meters: number | null
          duration_ms: number | null
          end_time: string | null
          id: string
          session_id: string
          start_time: string
        }
        Insert: {
          created_at?: string
          distance_meters?: number | null
          duration_ms?: number | null
          end_time?: string | null
          id?: string
          session_id: string
          start_time: string
        }
        Update: {
          created_at?: string
          distance_meters?: number | null
          duration_ms?: number | null
          end_time?: string | null
          id?: string
          session_id?: string
          start_time?: string
        }
        Relationships: [
          {
            foreignKeyName: "sprint_timing_results_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sprint_timing_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      sprint_timing_sessions: {
        Row: {
          created_at: string
          created_by: string | null
          distance_meters: number | null
          distances: number[] | null
          id: string
          session_code: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          distance_meters?: number | null
          distances?: number[] | null
          id?: string
          session_code: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          distance_meters?: number | null
          distances?: number[] | null
          id?: string
          session_code?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sprint_timing_sessions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "app_users"
            referencedColumns: ["id"]
          },
        ]
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
          coach_id: string | null
          created_at: string | null
          created_by: string | null
          id: string
          notes: string | null
          test_date: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          coach_id?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          notes?: string | null
          test_date?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          coach_id?: string | null
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
            foreignKeyName: "strength_test_sessions_coach_id_fkey"
            columns: ["coach_id"]
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
      stretches: {
        Row: {
          created_at: string
          description: string | null
          duration_seconds: number | null
          id: string
          name: string
          updated_at: string
          video_url: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          duration_seconds?: number | null
          id?: string
          name: string
          updated_at?: string
          video_url?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          duration_seconds?: number | null
          id?: string
          name?: string
          updated_at?: string
          video_url?: string | null
        }
        Relationships: []
      }
      subscription_types: {
        Row: {
          allowed_sections: string[] | null
          available_in_shop: boolean
          created_at: string
          description: string | null
          duration_months: number
          features: Json | null
          id: string
          is_active: boolean | null
          name: string
          price: number
          program_id: string | null
          single_purchase: boolean | null
          subscription_mode: string
          visit_count: number | null
          visit_expiry_months: number | null
        }
        Insert: {
          allowed_sections?: string[] | null
          available_in_shop?: boolean
          created_at?: string
          description?: string | null
          duration_months?: number
          features?: Json | null
          id?: string
          is_active?: boolean | null
          name: string
          price: number
          program_id?: string | null
          single_purchase?: boolean | null
          subscription_mode?: string
          visit_count?: number | null
          visit_expiry_months?: number | null
        }
        Update: {
          allowed_sections?: string[] | null
          available_in_shop?: boolean
          created_at?: string
          description?: string | null
          duration_months?: number
          features?: Json | null
          id?: string
          is_active?: boolean | null
          name?: string
          price?: number
          program_id?: string | null
          single_purchase?: boolean | null
          subscription_mode?: string
          visit_count?: number | null
          visit_expiry_months?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "subscription_types_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "programs"
            referencedColumns: ["id"]
          },
        ]
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
          coach_id: string | null
          created_at: string | null
          created_by: string | null
          date: string
          id: string
          notes: string | null
          scheduled_date: string | null
          status: string | null
          test_type: string | null
          test_type_id: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          coach_id?: string | null
          created_at?: string | null
          created_by?: string | null
          date: string
          id?: string
          notes?: string | null
          scheduled_date?: string | null
          status?: string | null
          test_type?: string | null
          test_type_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          coach_id?: string | null
          created_at?: string | null
          created_by?: string | null
          date?: string
          id?: string
          notes?: string | null
          scheduled_date?: string | null
          status?: string | null
          test_type?: string | null
          test_type_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tests_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "app_users"
            referencedColumns: ["id"]
          },
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
      training_phase_config: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          intensity_range_max: number | null
          intensity_range_min: number | null
          parent_phase_key: string | null
          phase_key: string
          phase_name: string
          phase_type: string
          rep_range_max: number | null
          rep_range_min: number | null
          reps_mode: string | null
          rest_range_max: number | null
          rest_range_min: number | null
          tempo_recommendation: string | null
          training_philosophy: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          intensity_range_max?: number | null
          intensity_range_min?: number | null
          parent_phase_key?: string | null
          phase_key: string
          phase_name: string
          phase_type?: string
          rep_range_max?: number | null
          rep_range_min?: number | null
          reps_mode?: string | null
          rest_range_max?: number | null
          rest_range_min?: number | null
          tempo_recommendation?: string | null
          training_philosophy?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          intensity_range_max?: number | null
          intensity_range_min?: number | null
          parent_phase_key?: string | null
          phase_key?: string
          phase_name?: string
          phase_type?: string
          rep_range_max?: number | null
          rep_range_min?: number | null
          reps_mode?: string | null
          rest_range_max?: number | null
          rest_range_min?: number | null
          tempo_recommendation?: string | null
          training_philosophy?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      training_type_stats: {
        Row: {
          assignment_id: string | null
          created_at: string
          id: string
          minutes: number
          training_date: string
          training_type: string
          updated_at: string
          user_id: string
          workout_completion_id: string | null
        }
        Insert: {
          assignment_id?: string | null
          created_at?: string
          id?: string
          minutes?: number
          training_date: string
          training_type: string
          updated_at?: string
          user_id: string
          workout_completion_id?: string | null
        }
        Update: {
          assignment_id?: string | null
          created_at?: string
          id?: string
          minutes?: number
          training_date?: string
          training_type?: string
          updated_at?: string
          user_id?: string
          workout_completion_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "training_type_stats_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: false
            referencedRelation: "program_assignments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "training_type_stats_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "app_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "training_type_stats_workout_completion_id_fkey"
            columns: ["workout_completion_id"]
            isOneToOne: false
            referencedRelation: "workout_completions"
            referencedColumns: ["id"]
          },
        ]
      }
      user_annual_phases: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          month: number
          notes: string | null
          phase: string
          updated_at: string
          user_id: string
          year: number
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          month: number
          notes?: string | null
          phase: string
          updated_at?: string
          user_id: string
          year: number
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          month?: number
          notes?: string | null
          phase?: string
          updated_at?: string
          user_id?: string
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "user_annual_phases_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "app_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_annual_phases_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "app_users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_annual_planning: {
        Row: {
          created_at: string | null
          created_by: string | null
          id: string
          monthly_phases: Json | null
          notes: string | null
          updated_at: string | null
          user_id: string
          weekly_phases: Json | null
          year: number
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          monthly_phases?: Json | null
          notes?: string | null
          updated_at?: string | null
          user_id: string
          weekly_phases?: Json | null
          year: number
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          monthly_phases?: Json | null
          notes?: string | null
          updated_at?: string | null
          user_id?: string
          weekly_phases?: Json | null
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "user_annual_planning_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "app_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_annual_planning_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "app_users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_campaign_participations: {
        Row: {
          campaign_id: string
          claimed_at: string | null
          created_at: string
          discount_code: string | null
          discount_percentage: number | null
          id: string
          is_claimed: boolean
          magic_box_id: string | null
          prize_id: string | null
          result_type: string
          subscription_type_id: string | null
          user_id: string
        }
        Insert: {
          campaign_id: string
          claimed_at?: string | null
          created_at?: string
          discount_code?: string | null
          discount_percentage?: number | null
          id?: string
          is_claimed?: boolean
          magic_box_id?: string | null
          prize_id?: string | null
          result_type: string
          subscription_type_id?: string | null
          user_id: string
        }
        Update: {
          campaign_id?: string
          claimed_at?: string | null
          created_at?: string
          discount_code?: string | null
          discount_percentage?: number | null
          id?: string
          is_claimed?: boolean
          magic_box_id?: string | null
          prize_id?: string | null
          result_type?: string
          subscription_type_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_campaign_participations_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "magic_box_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_campaign_participations_magic_box_id_fkey"
            columns: ["magic_box_id"]
            isOneToOne: false
            referencedRelation: "user_magic_boxes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_campaign_participations_prize_id_fkey"
            columns: ["prize_id"]
            isOneToOne: false
            referencedRelation: "campaign_prizes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_campaign_participations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "app_users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_discount_coupons: {
        Row: {
          code: string
          created_at: string
          discount_percentage: number
          expires_at: string | null
          id: string
          is_used: boolean
          participation_id: string | null
          used_at: string | null
          user_id: string
        }
        Insert: {
          code: string
          created_at?: string
          discount_percentage: number
          expires_at?: string | null
          id?: string
          is_used?: boolean
          participation_id?: string | null
          used_at?: string | null
          user_id: string
        }
        Update: {
          code?: string
          created_at?: string
          discount_percentage?: number
          expires_at?: string | null
          id?: string
          is_used?: boolean
          participation_id?: string | null
          used_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_discount_coupons_participation_id_fkey"
            columns: ["participation_id"]
            isOneToOne: false
            referencedRelation: "user_campaign_participations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_discount_coupons_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "app_users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_exercise_1rm: {
        Row: {
          created_at: string
          created_by: string | null
          exercise_id: string
          id: string
          notes: string | null
          recorded_date: string
          updated_at: string
          user_id: string
          weight: number
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          exercise_id: string
          id?: string
          notes?: string | null
          recorded_date?: string
          updated_at?: string
          user_id: string
          weight: number
        }
        Update: {
          created_at?: string
          created_by?: string | null
          exercise_id?: string
          id?: string
          notes?: string | null
          recorded_date?: string
          updated_at?: string
          user_id?: string
          weight?: number
        }
        Relationships: [
          {
            foreignKeyName: "user_exercise_1rm_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "app_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_exercise_1rm_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_exercise_1rm_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "app_users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_exercise_actuals: {
        Row: {
          actual_kg: string | null
          actual_reps: string | null
          actual_velocity_ms: string | null
          assignment_id: string
          created_at: string
          day_number: number
          exercise_id: string
          id: string
          notes: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          actual_kg?: string | null
          actual_reps?: string | null
          actual_velocity_ms?: string | null
          assignment_id: string
          created_at?: string
          day_number: number
          exercise_id: string
          id?: string
          notes?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          actual_kg?: string | null
          actual_reps?: string | null
          actual_velocity_ms?: string | null
          assignment_id?: string
          created_at?: string
          day_number?: number
          exercise_id?: string
          id?: string
          notes?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_exercise_actuals_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: false
            referencedRelation: "program_assignments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_exercise_actuals_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_exercise_actuals_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "app_users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_magic_boxes: {
        Row: {
          campaign_id: string
          created_at: string
          id: string
          is_opened: boolean
          opened_at: string | null
          updated_at: string
          user_id: string
          won_prize_id: string | null
        }
        Insert: {
          campaign_id: string
          created_at?: string
          id?: string
          is_opened?: boolean
          opened_at?: string | null
          updated_at?: string
          user_id: string
          won_prize_id?: string | null
        }
        Update: {
          campaign_id?: string
          created_at?: string
          id?: string
          is_opened?: boolean
          opened_at?: string | null
          updated_at?: string
          user_id?: string
          won_prize_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_magic_boxes_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "magic_box_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_magic_boxes_won_prize_id_fkey"
            columns: ["won_prize_id"]
            isOneToOne: false
            referencedRelation: "campaign_prizes"
            referencedColumns: ["id"]
          },
        ]
      }
      user_monthly_phases: {
        Row: {
          created_at: string
          id: string
          month: number
          phase: string
          updated_at: string
          user_id: string
          week: number
          year: number
        }
        Insert: {
          created_at?: string
          id?: string
          month: number
          phase: string
          updated_at?: string
          user_id: string
          week: number
          year: number
        }
        Update: {
          created_at?: string
          id?: string
          month?: number
          phase?: string
          updated_at?: string
          user_id?: string
          week?: number
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "user_monthly_phases_user_id_fkey"
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
          coach_id: string | null
          created_at: string
          end_date: string
          id: string
          is_paid: boolean
          is_paused: boolean | null
          notes: string | null
          paused_at: string | null
          paused_days_remaining: number | null
          payment_id: string | null
          start_date: string
          status: string
          subscription_type_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          archived_at?: string | null
          auto_renewal?: boolean | null
          coach_id?: string | null
          created_at?: string
          end_date: string
          id?: string
          is_paid?: boolean
          is_paused?: boolean | null
          notes?: string | null
          paused_at?: string | null
          paused_days_remaining?: number | null
          payment_id?: string | null
          start_date?: string
          status?: string
          subscription_type_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          archived_at?: string | null
          auto_renewal?: boolean | null
          coach_id?: string | null
          created_at?: string
          end_date?: string
          id?: string
          is_paid?: boolean
          is_paused?: boolean | null
          notes?: string | null
          paused_at?: string | null
          paused_days_remaining?: number | null
          payment_id?: string | null
          start_date?: string
          status?: string
          subscription_type_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_subscriptions_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "app_users"
            referencedColumns: ["id"]
          },
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
      user_videocalls: {
        Row: {
          approved_at: string | null
          created_at: string
          created_by: string | null
          id: string
          meeting_link: string | null
          notes: string | null
          rejected_at: string | null
          requested_at: string | null
          status: string | null
          updated_at: string
          user_id: string
          videocall_date: string
          videocall_time: string
          videocall_type: string
        }
        Insert: {
          approved_at?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          meeting_link?: string | null
          notes?: string | null
          rejected_at?: string | null
          requested_at?: string | null
          status?: string | null
          updated_at?: string
          user_id: string
          videocall_date?: string
          videocall_time?: string
          videocall_type?: string
        }
        Update: {
          approved_at?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          meeting_link?: string | null
          notes?: string | null
          rejected_at?: string | null
          requested_at?: string | null
          status?: string | null
          updated_at?: string
          user_id?: string
          videocall_date?: string
          videocall_time?: string
          videocall_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_user_videocalls_user_id"
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
      user_weekly_phases: {
        Row: {
          accessory_subphase: string | null
          created_at: string
          day: number
          id: string
          month: number
          phase: string
          primary_subphase: string | null
          secondary_subphase: string | null
          updated_at: string
          user_id: string
          week: number
          year: number
        }
        Insert: {
          accessory_subphase?: string | null
          created_at?: string
          day: number
          id?: string
          month: number
          phase: string
          primary_subphase?: string | null
          secondary_subphase?: string | null
          updated_at?: string
          user_id: string
          week: number
          year: number
        }
        Update: {
          accessory_subphase?: string | null
          created_at?: string
          day?: number
          id?: string
          month?: number
          phase?: string
          primary_subphase?: string | null
          secondary_subphase?: string | null
          updated_at?: string
          user_id?: string
          week?: number
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "user_weekly_phases_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "app_users"
            referencedColumns: ["id"]
          },
        ]
      }
      videocall_packages: {
        Row: {
          created_at: string
          expiry_date: string | null
          id: string
          payment_id: string | null
          price: number | null
          purchase_date: string
          remaining_videocalls: number
          status: string
          total_videocalls: number
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
          remaining_videocalls: number
          status?: string
          total_videocalls: number
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
          remaining_videocalls?: number
          status?: string
          total_videocalls?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_videocall_packages_user_id"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "app_users"
            referencedColumns: ["id"]
          },
        ]
      }
      visit_packages: {
        Row: {
          allowed_sections: string[] | null
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
          allowed_sections?: string[] | null
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
          allowed_sections?: string[] | null
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
          rpe_score: number | null
          scheduled_date: string
          start_time: string | null
          status: string
          status_color: string | null
          total_volume: number | null
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
          rpe_score?: number | null
          scheduled_date: string
          start_time?: string | null
          status?: string
          status_color?: string | null
          total_volume?: number | null
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
          rpe_score?: number | null
          scheduled_date?: string
          start_time?: string | null
          status?: string
          status_color?: string | null
          total_volume?: number | null
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
      workout_stats: {
        Row: {
          accessory_minutes: number | null
          assignment_id: string
          created_at: string
          endurance_minutes: number
          hypertrophy_minutes: number | null
          id: string
          power_minutes: number
          scheduled_date: string
          speed_minutes: number
          strength_minutes: number
          total_duration_minutes: number
          total_volume_kg: number
          training_type_breakdown: Json | null
          updated_at: string
          user_id: string
        }
        Insert: {
          accessory_minutes?: number | null
          assignment_id: string
          created_at?: string
          endurance_minutes?: number
          hypertrophy_minutes?: number | null
          id?: string
          power_minutes?: number
          scheduled_date: string
          speed_minutes?: number
          strength_minutes?: number
          total_duration_minutes?: number
          total_volume_kg?: number
          training_type_breakdown?: Json | null
          updated_at?: string
          user_id: string
        }
        Update: {
          accessory_minutes?: number | null
          assignment_id?: string
          created_at?: string
          endurance_minutes?: number
          hypertrophy_minutes?: number | null
          id?: string
          power_minutes?: number
          scheduled_date?: string
          speed_minutes?: number
          strength_minutes?: number
          total_duration_minutes?: number
          total_volume_kg?: number
          training_type_breakdown?: Json | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workout_stats_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: false
            referencedRelation: "program_assignments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workout_stats_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "app_users"
            referencedColumns: ["id"]
          },
        ]
      }
      workout_training_types: {
        Row: {
          created_at: string
          duration_minutes: number
          id: string
          training_type: string
          updated_at: string
          workout_completion_id: string
        }
        Insert: {
          created_at?: string
          duration_minutes?: number
          id?: string
          training_type: string
          updated_at?: string
          workout_completion_id: string
        }
        Update: {
          created_at?: string
          duration_minutes?: number
          id?: string
          training_type?: string
          updated_at?: string
          workout_completion_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workout_training_types_workout_completion_id_fkey"
            columns: ["workout_completion_id"]
            isOneToOne: false
            referencedRelation: "workout_completions"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      admin_delete_athlete: { Args: { athlete_id: string }; Returns: undefined }
      admin_delete_athlete_memberships: {
        Args: { athlete_id: string }
        Returns: undefined
      }
      can_cancel_booking: { Args: { booking_id: string }; Returns: boolean }
      check_and_update_expired_subscriptions: {
        Args: never
        Returns: undefined
      }
      cleanup_expired_ai_chat_files: { Args: never; Returns: undefined }
      cleanup_expired_waiting_list: { Args: never; Returns: undefined }
      create_exercise_tables: { Args: never; Returns: undefined }
      exec_sql: { Args: { query: string }; Returns: Json }
      force_delete_athlete: { Args: { athlete_id: string }; Returns: undefined }
      generate_coupon_code: { Args: never; Returns: string }
      get_app_user_id_safe: { Args: { user_auth_id: string }; Returns: string }
      get_current_user_role: { Args: never; Returns: string }
      get_latest_1rm: {
        Args: { athlete_id: string; exercise_id: string }
        Returns: number
      }
      get_suggested_velocity: {
        Args: { athlete_id: string; exercise_id: string; percentage: number }
        Returns: number
      }
      get_user_available_bookings: {
        Args: { user_uuid: string }
        Returns: Json
      }
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["user_role"]
      }
      get_user_role_safe: { Args: { user_auth_id: string }; Returns: string }
      has_active_subscription: { Args: { user_uuid: string }; Returns: boolean }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["user_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin_safe: { Args: { user_auth_id: string }; Returns: boolean }
      is_coach_safe: { Args: { user_auth_id: string }; Returns: boolean }
      join_waiting_list:
        | {
            Args: {
              p_booking_date: string
              p_booking_time: string
              p_section_id: string
              p_user_id: string
            }
            Returns: string
          }
        | {
            Args: {
              p_booking_date: string
              p_booking_time: string
              p_booking_type?: string
              p_section_id: string
              p_user_id: string
            }
            Returns: string
          }
      leave_waiting_list:
        | {
            Args: {
              p_booking_date: string
              p_booking_time: string
              p_section_id: string
              p_user_id: string
            }
            Returns: boolean
          }
        | {
            Args: {
              p_booking_date: string
              p_booking_time: string
              p_booking_type?: string
              p_section_id: string
              p_user_id: string
            }
            Returns: boolean
          }
      mark_booking_completed: {
        Args: { booking_id: string }
        Returns: undefined
      }
      mark_booking_missed: { Args: { booking_id: string }; Returns: undefined }
      mark_past_bookings_as_missed: { Args: never; Returns: number }
      notify_next_in_waiting_list:
        | {
            Args: {
              p_booking_date: string
              p_booking_time: string
              p_section_id: string
            }
            Returns: string
          }
        | {
            Args: {
              p_booking_date: string
              p_booking_time: string
              p_booking_type?: string
              p_section_id: string
            }
            Returns: string
          }
      pause_subscription: {
        Args: { subscription_id: string }
        Returns: undefined
      }
      record_videocall: {
        Args: {
          p_created_by?: string
          p_notes?: string
          p_user_id: string
          p_videocall_type?: string
        }
        Returns: string
      }
      record_visit: {
        Args: {
          p_created_by?: string
          p_notes?: string
          p_user_id: string
          p_visit_type?: string
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
      send_videocall_reminders: {
        Args: {
          reminder_type: string
          time_window_end: unknown
          time_window_start: unknown
        }
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
