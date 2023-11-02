import { ChatOpenAI } from "langchain/chat_models/openai";
import { PromptTemplate } from "langchain/prompts";
import { StringOutputParser } from "langchain/schema/output_parser";
import { retriever } from "./utils/retriever.js";
import { combineDocuments } from "./utils/combineDocuments.js";
import {
	RunnablePassthrough,
	RunnableSequence,
} from "langchain/schema/runnable";
import { formatConvHistory } from "./utils/formatConvHistory.js";

document.addEventListener("submit", (e) => {
	e.preventDefault();
	progressConversation();
});

const openAIApiKey = import.meta.env.VITE_OPENAI_API_KEY;
const llm = new ChatOpenAI({ openAIApiKey });

// A string holding the phrasing of the prompt
const standaloneQuestionTemplate = `Given a question and also the conversation history (conv_history), 
	convert it to a standalone question. 
	question: {question} 
	conv_history: {conv_history}
	standalone question:
	`;

// A prompt created using PromptTemplate and the fromTemplate method
const standaloneQuestionPrompt = PromptTemplate.fromTemplate(
	standaloneQuestionTemplate
);

const answerTemplate = `You are a helpful and enthusiastic support bot who can answer a given question about Scrimba based on the context provided. 
Try to find the answer in the context and also the conversation history (conv_history). If you really don't know the answer, say "I'm sorry, I don't know the answer to that." 
And direct the questioner to email help@scrimba.com. Don't try to make up an answer. Always speak as if you were chatting to a friend.
context: {context}
conv_history: {conv_history}
question: {question}
answer:
`;

const answerPrompt = PromptTemplate.fromTemplate(answerTemplate);

const standaloneQuestionChain = RunnableSequence.from([
	standaloneQuestionPrompt,
	llm,
	new StringOutputParser(),
]);

const retrieverChain = RunnableSequence.from([
	(prevResult) => prevResult.standalone_question, // to access the standalone question from the previous step
	retriever,
	combineDocuments,
]);

const answerChain = RunnableSequence.from([
	answerPrompt,
	llm,
	new StringOutputParser(),
]);

const chain = RunnableSequence.from([
	{
		standalone_question: standaloneQuestionChain,
		original_input: new RunnablePassthrough(),
	},
	{
		context: retrieverChain,
		question: ({ original_input }) => original_input.question,
		conv_history: ({ original_input }) => original_input.conv_history,
	},
	answerChain,
]);

const convHistory = [];

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
	// Await the response when you INVOKE the chain.
	// Remember to pass in a question.
	const response = await chain.invoke({
		question: question,
		conv_history: formatConvHistory(convHistory),
	});
	convHistory.push(question);
	convHistory.push(response);

	// add AI message
	const newAiSpeechBubble = document.createElement("div");
	newAiSpeechBubble.classList.add("speech", "speech-ai");
	chatbotConversation.appendChild(newAiSpeechBubble);
	newAiSpeechBubble.textContent = response;
	chatbotConversation.scrollTop = chatbotConversation.scrollHeight;
}
