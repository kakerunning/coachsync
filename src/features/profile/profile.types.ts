export type UserProfile = {
  id: string;
  name: string;
  email: string;
  language: string;
  imageUrl: string | null;
  role: string;
};

export type UpdateProfileInput = {
  name?: string;
  language?: string;
  imageUrl?: string | null;
};
