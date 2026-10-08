// Advertising is off unless NEXT_PUBLIC_ADSENSE_CLIENT is set at build time (for example
// "ca-pub-1234567890123456"). Set it, with an ad-unit id, in the host's environment variables.
// Nothing about ads loads, and no third-party script runs, while it is unset.

export const ADS_CLIENT = (process.env.NEXT_PUBLIC_ADSENSE_CLIENT ?? "").trim();
export const ADS_SLOT = (process.env.NEXT_PUBLIC_ADSENSE_SLOT ?? "").trim();
export const adsEnabled = /^ca-pub-\d{8,20}$/.test(ADS_CLIENT) && /^\d{6,20}$/.test(ADS_SLOT);
