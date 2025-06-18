// Type interfaces for update operations
export interface UpdatePasswordType {
  currentPassword: string;
  newPassword: string;
}

export interface UpdateFullnameType {
  fullname: string;
}

export interface UpdateUsernameType {
  username: string;
}

export interface UpdateBioType {
  bio: string;
}

export interface UpdateSettingsType {
  notificationRadius?: number;
  language?: 'en' | 'vi';
}
