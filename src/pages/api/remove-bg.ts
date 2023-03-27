// pages/api/upload.ts
import { NextApiRequest, NextApiResponse } from "next";

import { replicate } from "@/utils/replicateClient";

import { getSession } from "next-auth/react";

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
	const session = await getSession({ req });

	if (!session?.user) {
		return res.status(401).json({ message: "Not authenticated" });
	}
	console.log(req.body);
	const response = await replicate.run(
		"cjwbw/rembg:fb8af171cfa1616ddcf1242c093f9c46bcada5ad4cf6f2fbe8b81b330ec5c003",
		{
			input: {
				image: req.body,
			},
		}
	);

	return res.json({ success: true, data: response });
};

export default handler;
