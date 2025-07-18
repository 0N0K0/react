import axios from 'axios';

const instance = axios.create({
	baseURL: 'https://localhost',
	headers: {
		'Content-Type': 'application/json',
	},
});

// Ajoute le token à chaque requête si présent
instance.interceptors.request.use((config) => {
	const token = localStorage.getItem('token');
	if (token) {
		config.headers['Authorization'] = `Bearer ${token}`;
	}
	return config;
});

// Intercepteur de réponse pour gérer le refresh token
instance.interceptors.response.use(
	(response) => response,
	async (error) => {
		const originalRequest = error.config;
		if (error.response && error.response.status === 401 && !originalRequest._retry) {
			originalRequest._retry = true;
			const refreshToken = localStorage.getItem('token');
			if (refreshToken) {
				try {
					const res = await axios.post('https://localhost/api/token/refresh', {
						refresh_token: refreshToken,
					});
					if (res.status === 200) {
						const newToken = res.data.token;
						localStorage.setItem('token', newToken);
						// Met à jour le header Authorization
						instance.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
						originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
						// Relance la requête initiale
						return instance(originalRequest);
					}
				} catch (refreshError) {
					// Si le refresh échoue, on peut forcer la déconnexion
					localStorage.removeItem('token');
					window.location.href = '/login';
				}
			} else {
				// Pas de refresh token, forcer la déconnexion
				localStorage.removeItem('token');
				window.location.href = '/login';
			}
		}
		return Promise.reject(error);
	}
);

export default instance;
