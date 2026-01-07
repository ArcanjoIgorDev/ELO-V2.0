
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          username: string
          full_name: string | null
          bio: string | null
          avatar_url: string | null
          cover_url: string | null
          has_seen_tutorial: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          username: string
          full_name?: string | null
          bio?: string | null
          avatar_url?: string | null
          cover_url?: string | null
          has_seen_tutorial?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          username?: string
          full_name?: string | null
          bio?: string | null
          avatar_url?: string | null
          cover_url?: string | null
          has_seen_tutorial?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      posts: {
        Row: {
          id: string
          user_id: string
          content: string
          image_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          content: string
          image_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          content?: string
          image_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      post_views: {
        Row: {
          id: string
          post_id: string
          user_id: string
          created_at: string
        }
        Insert: {
          id?: string
          post_id: string
          user_id: string
          created_at?: string
        }
      }
      likes: {
        Row: {
          id: string
          user_id: string
          post_id: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          post_id: string
          created_at?: string
        }
      }
      comments: {
        Row: {
          id: string
          post_id: string
          user_id: string
          content: string
          created_at: string
        }
        Insert: {
          id?: string
          post_id: string
          user_id: string
          content: string
          created_at?: string
        }
      }
      comment_likes: {
        Row: {
          id: string
          user_id: string
          comment_id: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          comment_id: string
          created_at?: string
        }
      }
      connections: {
        Row: {
          id: string
          requester_id: string
          receiver_id: string
          status: 'pending' | 'accepted' | 'declined' | 'blocked'
          created_at: string
          updated_at?: string
        }
        Insert: {
          id?: string
          requester_id: string
          receiver_id: string
          status: 'pending' | 'accepted' | 'declined' | 'blocked'
          created_at?: string
          updated_at?: string
        }
        Update: {
          status?: 'pending' | 'accepted' | 'declined' | 'blocked'
          updated_at?: string
        }
      }
      messages: {
        Row: {
          id: string
          sender_id: string
          receiver_id: string
          content: string
          is_read: boolean
          created_at: string
        }
        Insert: {
          sender_id: string
          receiver_id: string
          content: string
          is_read?: boolean
          created_at?: string
        }
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          actor_id: string
          type: 'like_post' | 'like_comment' | 'comment' | 'request_received' | 'request_accepted' | 'request_declined' | 'message'
          reference_id: string | null
          is_read: boolean
          created_at: string
        }
        Insert: {
          user_id: string
          actor_id: string
          type: string
          reference_id?: string | null
          is_read?: boolean
        }
        Update: {
          is_read?: boolean
        }
      }
      echos: {
        Row: {
          id: string
          user_id: string
          content: string
          type: 'image' | 'text'
          expires_at: string
          created_at: string
        }
        Insert: {
          user_id: string
          content: string
          type?: 'image' | 'text'
          expires_at?: string
        }
      }
      echo_likes: {
        Row: {
          id: string
          user_id: string
          echo_id: string
          created_at: string
        }
        Insert: {
          user_id: string
          echo_id: string
        }
      }
      echo_comments: {
        Row: {
          id: string
          user_id: string
          echo_id: string
          content: string
          created_at: string
        }
        Insert: {
          user_id: string
          echo_id: string
          content: string
        }
      }
    }
  }
}

export type Profile = Database['public']['Tables']['profiles']['Row'];
export type Post = Database['public']['Tables']['posts']['Row'];
export type PostView = Database['public']['Tables']['post_views']['Row'];
export type Like = Database['public']['Tables']['likes']['Row'];
export type Comment = Database['public']['Tables']['comments']['Row'];
export type Connection = Database['public']['Tables']['connections']['Row'];
export type Message = Database['public']['Tables']['messages']['Row'];
export type Notification = Database['public']['Tables']['notifications']['Row'];
export type Echo = Database['public']['Tables']['echos']['Row'];
export type EchoLike = Database['public']['Tables']['echo_likes']['Row'];
export type EchoComment = Database['public']['Tables']['echo_comments']['Row'];

export interface PostWithAuthor extends Post {
  author: Profile;
  likes_count: number;
  comments_count: number;
  views_count?: number;
  user_has_liked: boolean;
}

export interface CommentWithAuthor extends Comment {
  author: Profile;
  likes_count: number;
  user_has_liked: boolean;
}

export interface EchoWithAuthor extends Echo {
  author_avatar?: string;
  author_username?: string;
  likes_count: number;
  comments_count: number;
  user_has_liked: boolean;
}
