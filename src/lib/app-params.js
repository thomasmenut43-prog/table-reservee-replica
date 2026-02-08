// App parameters - Standalone version (no Base44)
// These are just placeholder values for compatibility

export const appParams = {
	appId: 'standalone_app',
	token: null,
	fromUrl: typeof window !== 'undefined' ? window.location.href : '',
	functionsVersion: 'local',
	appBaseUrl: typeof window !== 'undefined' ? window.location.origin : ''
};
