export type PassportApplication = {
  id?: string;
  first_name: string;
  last_name: string;
  middle_name?: string;
  date_of_birth: string;
  gender: 'male' | 'female' | 'other';
  place_of_birth: string;
  nationality: string;
  occupation: string;
  email: string;
  phone_number: string;
  address: string;
  passport_type: 'standard' | 'official' | 'diplomatic';
  validity_period: '5_years' | '10_years';
  status: 'pending' | 'processing' | 'approved' | 'rejected';
  created_at?: string;
};
