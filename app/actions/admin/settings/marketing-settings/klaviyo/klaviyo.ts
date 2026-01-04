// File: app/actions/admin/settings/marketing-settings/klaviyo/klaviyo.ts

export interface KlaviyoProfileAttributes {
  email: string | null;
  phone_number: string | null;
  external_id: string | null;
  first_name: string | null;
  last_name: string | null;
  organization: string | null;
  title: string | null;
  image: string | null;
  created: string;
  updated: string;
  last_event_date: string | null;
  location: {
    address1: string | null;
    address2: string | null;
    city: string | null;
    country: string | null;
    region: string | null;
    zip: string | null;
    timezone: string | null;
  } | null;
  properties: Record<string, any> | null;
}

export interface KlaviyoProfile {
  type: "profile";
  id: string;
  attributes: KlaviyoProfileAttributes;
  links: {
    self: string;
  };
}

export interface KlaviyoResponse {
  data: KlaviyoProfile[];
  links: {
    self: string;
    next?: string;
    prev?: string;
  };
}