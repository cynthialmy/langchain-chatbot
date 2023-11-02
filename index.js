import { ChatOpenAI } from "langchain/chat_models/openai";
import { PromptTemplate } from "langchain/prompts";
import { SupabaseVectorStore } from "langchain/vectorstores/supabase";
import { OpenAIEmbeddings } from "langchain/embeddings/openai";
import { createClient } from "@supabase/supabase-js";
import { StringOutputParser } from "langchain/schema/output_parser";

document.addEventListener("submit", (e) => {
	e.preventDefault();
	progressConversation();
});

const openAIApiKey = import.meta.env.VITE_OPENAI_API_KEY;
const sbApiKey = import.meta.env.VITE_SUPABASE_API_KEY;
const sbUrl = import.meta.env.VITE_SUPABASE_URL_LC_CHATBOT;

const embeddings = new OpenAIEmbeddings({ openAIApiKey });
const client = createClient(sbUrl, sbApiKey);

const vectorStore = new SupabaseVectorStore(embeddings, {
	client,
	tableName: "documents",
	queryName: "match_documents",
});

const retriever = vectorStore.asRetriever();

const llm = new ChatOpenAI({ openAIApiKey });

// A string holding the phrasing of the prompt
const standaloneQuestionTemplate =
	"Given a question, convert it to a standalone question. question: {question} standalone question:";

// A prompt created using PromptTemplate and the fromTemplate method
const standaloneQuestionPrompt = PromptTemplate.fromTemplate(
	standaloneQuestionTemplate
);

// Take the standaloneQuestionPrompt and PIPE the model
const standaloneQuestionChain = standaloneQuestionPrompt
	.pipe(llm) // get the standalone question
	.pipe(new StringOutputParser()) // parse the output as a string
	.pipe(retriever); // get the nearest answer from the vector store

// Await the response when you INVOKE the chain.
// Remember to pass in a question.
const response = await standaloneQuestionChain.invoke({
	question:
		"The following is a paragraph about the history of the United States. The United States of America (USA), commonly known as the United States (U.S. or US), or America, is a country primarily located in North America, consisting of 50 states, a federal district, five major self-governing territories, and various possessions. At 3.8 million square miles (9.8 million square kilometers), it is the world's third- or fourth-largest country by total area. With a population of over 328 million, it is the third most populous country in the world. Give me some data about the demographics of these cities. The national capital is Washington, D.C., and the most populous city is New York City.",
});

console.log(response);

async function progressConversation() {
	const userInput = document.getElementById("user-input");
	const chatbotConversation = document.getElementById(
		"chatbot-conversation-container"
	);
	const question = userInput.value;
	userInput.value = "";

	// add human message
	const newHumanSpeechBubble = document.createElement("div");
	newHumanSpeechBubble.classList.add("speech", "speech-human");
	chatbotConversation.appendChild(newHumanSpeechBubble);
	newHumanSpeechBubble.textContent = question;
	chatbotConversation.scrollTop = chatbotConversation.scrollHeight;

	// add AI message
	const newAiSpeechBubble = document.createElement("div");
	newAiSpeechBubble.classList.add("speech", "speech-ai");
	chatbotConversation.appendChild(newAiSpeechBubble);
	newAiSpeechBubble.textContent = result;
	chatbotConversation.scrollTop = chatbotConversation.scrollHeight;
}
