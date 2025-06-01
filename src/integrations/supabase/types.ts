export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
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
          role: string
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
          role: string
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
          role?: string
          updated_at?: string | null
          user_status?: string
        }
        Relationships: []
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
        Relationships: []
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
            referencedRelation: "program_templates"
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
            referencedRelation: "program_templates"
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
          id: string
          name: string
          updated_at: string | null
          week_id: string | null
        }
        Insert: {
          created_at?: string | null
          day_number: number
          id?: string
          name: string
          updated_at?: string | null
          week_id?: string | null
        }
        Update: {
          created_at?: string | null
          day_number?: number
          id?: string
          name?: string
          updated_at?: string | null
          week_id?: string | null
        }
        Relationships: [
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
            foreignKeyName: "program_weeks_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "program_templates"
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
        ]
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
    }
    Views: {
      program_templates: {
        Row: {
          created_at: string | null
          created_by: string | null
          days_count: number | null
          description: string | null
          duration: number | null
          exercises_count: number | null
          id: string | null
          is_template: boolean | null
          name: string | null
          status: string | null
          type: string | null
          updated_at: string | null
          weeks_count: number | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_programs_created_by"
            columns: ["created_by"]
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
        ]
      }
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
      has_role: {
        Args: {
          _user_id: string
          _role: Database["public"]["Enums"]["user_role"]
        }
        Returns: boolean
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

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
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
