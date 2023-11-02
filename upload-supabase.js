import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { createClient } from "@supabase/supabase-js";
import { SupabaseVectorStore } from "langchain/vectorstores/supabase";
import { OpenAIEmbeddings } from "langchain/embeddings/openai";

try {
	const result = await fetch("scrimba-info.txt");
	const text = await result.text();

	const splitter = new RecursiveCharacterTextSplitter({
		chunkSize: 500, // default 1000
		separators: ["\n\n", "\n", " ", ""], // default setting
		chunkOverlap: 50, // default 200
	});

	const output = await splitter.createDocuments([text]);

	const sbApiKey = import.meta.env.VITE_SUPABASE_API_KEY;
	const sbUrl = import.meta.env.VITE_SUPABASE_URL_LC_CHATBOT;
	const openAIApiKey = import.meta.env.VITE_OPENAI_API_KEY;

	const client = createClient(sbUrl, sbApiKey);

	await SupabaseVectorStore.fromDocuments(
		output,
		new OpenAIEmbeddings({ openAIApiKey }),
		{
			client,
			tableName: "documents",
		}
	);
} catch (err) {
	console.log(err);
}
