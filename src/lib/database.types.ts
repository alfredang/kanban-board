export type Database = {
  public: {
    Tables: {
      columns: {
        Row: {
          id: string;
          title: string;
          position: number;
        };
        Insert: {
          id: string;
          title: string;
          position: number;
        };
        Update: {
          id?: string;
          title?: string;
          position?: number;
        };
        Relationships: [];
      };
      tasks: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          description: string;
          priority: 'low' | 'medium' | 'high';
          column_id: string;
          position: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string;
          title: string;
          description?: string;
          priority?: 'low' | 'medium' | 'high';
          column_id: string;
          position?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          description?: string;
          priority?: 'low' | 'medium' | 'high';
          column_id?: string;
          position?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'tasks_column_id_fkey';
            columns: ['column_id'];
            isOneToOne: false;
            referencedRelation: 'columns';
            referencedColumns: ['id'];
          },
        ];
      };
      tags: {
        Row: {
          id: number;
          name: string;
        };
        Insert: {
          id?: number;
          name: string;
        };
        Update: {
          id?: number;
          name?: string;
        };
        Relationships: [];
      };
      task_tags: {
        Row: {
          task_id: string;
          tag_id: number;
        };
        Insert: {
          task_id: string;
          tag_id: number;
        };
        Update: {
          task_id?: string;
          tag_id?: number;
        };
        Relationships: [
          {
            foreignKeyName: 'task_tags_task_id_fkey';
            columns: ['task_id'];
            isOneToOne: false;
            referencedRelation: 'tasks';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'task_tags_tag_id_fkey';
            columns: ['tag_id'];
            isOneToOne: false;
            referencedRelation: 'tags';
            referencedColumns: ['id'];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      move_task: {
        Args: {
          p_task_id: string;
          p_source_column_id: string;
          p_dest_column_id: string;
          p_dest_index: number;
        };
        Returns: undefined;
      };
      compact_positions: {
        Args: {
          p_column_id: string;
          p_user_id?: string;
        };
        Returns: undefined;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};
