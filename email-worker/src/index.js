export default {
	async fetch(request, env) {

		const headers = {
			"Access-Control-Allow-Origin": "*",
			"Access-Control-Allow-Headers": "Content-Type",
			"Access-Control-Allow-Methods": "POST, OPTIONS"
		};

		if (request.method === "OPTIONS") {
			return new Response(null, { headers });
		}

		if (request.method !== "POST") {
			return new Response("Method Not Allowed", {
				status: 405,
				headers
			});
		}

		try {

			const { to, subject, html } = await request.json();

			const resendResponse = await fetch(
				"https://api.resend.com/emails",
				{
					method: "POST",
					headers: {
						"Authorization": `Bearer ${env.RESEND_API_KEY}`,
						"Content-Type": "application/json"
					},
					body: JSON.stringify({
						from: "onboarding@resend.dev",
						to: [to],
						subject,
						html
					})
				}
			);

			const result = await resendResponse.text();

			return new Response(result, {
				status: resendResponse.status,
				headers
			});

		} catch (error) {

			return new Response(
				JSON.stringify({
					success: false,
					message: error.message
				}),
				{
					status: 500,
					headers
				}
			);

		}

	}
};