// Shared DB + domain types. These mirror supabase/migrations exactly. Keep them in
// sync with the SQL: a column added there must be added here (and vice versa).

// ---- Enums (mirror the CHECK constraints in the migrations) ----
export type Plan = 'free' | 'unlocked';
export type Units = 'g' | 'oz';
export type RecipeType = 'glaze' | 'slip' | 'underglaze' | 'engobe';
export type FiringType = 'bisque' | 'glaze' | 'other';
export type Atmosphere = 'oxidation' | 'reduction';
export type Application = '1 coat' | '2 coat' | 'dip' | 'brush' | 'spray' | 'pour';
export type PhotoKind = 'before' | 'after';
export type PaymentType = 'unlock' | 'topup' | 'tip';

export const RECIPE_TYPES: RecipeType[] = ['glaze', 'slip', 'underglaze', 'engobe'];
export const FIRING_TYPES: FiringType[] = ['bisque', 'glaze', 'other'];
export const ATMOSPHERES: Atmosphere[] = ['oxidation', 'reduction'];
export const APPLICATIONS: Application[] = ['1 coat', '2 coat', 'dip', 'brush', 'spray', 'pour'];
export const RESULT_TAGS = [
  'glossy', 'matte', 'satin', 'crazed', 'pinholed', 'crawled', 'ran', 'dry', 'blistered', 'keeper',
] as const;

// ---- Row shapes ----
export type Profile = {
  user_id: string;
  plan: Plan;
  ai_credits: number;
  default_cone: string;
  units: Units;
  created_at: string;
  updated_at: string;
}

export type Recipe = {
  id: string;
  user_id: string;
  name: string;
  type: RecipeType;
  cone: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export type RecipeIngredient = {
  id: string;
  user_id: string;
  recipe_id: string;
  material: string;
  percent: number;
  created_at: string;
  updated_at: string;
}

export type FiringSegment = {
  rate: number | null;
  temp: number | null;
  hold: number | null;
}

export type Firing = {
  id: string;
  user_id: string;
  kiln: string | null;
  date: string | null;
  type: FiringType;
  target_cone: string | null;
  atmosphere: Atmosphere | null;
  schedule: FiringSegment[] | null;
  cost: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export type Test = {
  id: string;
  user_id: string;
  recipe_id: string | null;
  quick_glaze: string | null;
  parent_test_id: string | null;
  change_note: string | null;
  clay_body: string | null;
  firing_id: string | null;
  cone: string | null;
  atmosphere: Atmosphere | null;
  application: Application | null;
  result_rating: number | null;
  result_tags: string[];
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export type TestPhoto = {
  id: string;
  user_id: string;
  test_id: string;
  storage_path: string;
  is_cover: boolean;
  kind: PhotoKind;
  created_at: string;
  updated_at: string;
}

export type Payment = {
  id: string;
  user_id: string;
  type: PaymentType;
  amount: number;
  stripe_event_id: string;
  created_at: string;
}

// Helper: an Insert payload omits server-defaulted columns.
type Insertable<T, ServerDefaulted extends keyof T> = Omit<T, ServerDefaulted> &
  Partial<Pick<T, ServerDefaulted>>;
type Updatable<T> = Partial<T>;

// ---- Database type for the typed supabase-js client ----
// Each table MUST carry a `Relationships` key (even if empty) — supabase-js v2 /
// postgrest-js require the full GenericTable shape; omitting it makes the whole
// schema fail to match GenericSchema and every .insert()/.update() degrades to
// `never`. Relationships are left empty: embedded selects are narrowed with casts
// in the services (we don't lean on generated relationship inference).
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Insertable<Profile, 'created_at' | 'updated_at'>;
        Update: Updatable<Profile>;
        Relationships: [];
      };
      recipes: {
        Row: Recipe;
        Insert: Insertable<Recipe, 'id' | 'user_id' | 'created_at' | 'updated_at'>;
        Update: Updatable<Recipe>;
        Relationships: [];
      };
      recipe_ingredients: {
        Row: RecipeIngredient;
        Insert: Insertable<RecipeIngredient, 'id' | 'user_id' | 'created_at' | 'updated_at'>;
        Update: Updatable<RecipeIngredient>;
        Relationships: [];
      };
      firings: {
        Row: Firing;
        Insert: Insertable<Firing, 'id' | 'user_id' | 'created_at' | 'updated_at'>;
        Update: Updatable<Firing>;
        Relationships: [];
      };
      tests: {
        Row: Test;
        Insert: Insertable<Test, 'id' | 'user_id' | 'result_tags' | 'created_at' | 'updated_at'>;
        Update: Updatable<Test>;
        Relationships: [];
      };
      test_photos: {
        Row: TestPhoto;
        Insert: Insertable<TestPhoto, 'id' | 'user_id' | 'created_at' | 'updated_at'>;
        Update: Updatable<TestPhoto>;
        Relationships: [];
      };
      payments: {
        Row: Payment;
        Insert: Insertable<Payment, 'id' | 'created_at'>;
        Update: Updatable<Payment>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}

// ---- Composite domain types used by the UI ----
export type RecipeWithIngredients = Recipe & {
  recipe_ingredients: RecipeIngredient[];
};

export type TestWithRelations = Test & {
  recipe: Recipe | null;
  firing: Firing | null;
  test_photos: TestPhoto[];
};
