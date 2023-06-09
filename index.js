import { config } from "dotenv";
import { Client, GatewayIntentBits, AttachmentBuilder } from "discord.js";
import axios from "axios";
config();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

client.on("ready", (client) => {
  console.log(`${client.user.tag} is connected`);
});

client.on("messageCreate", async (message) => {
  if (
    message.author.id === client.user.id ||
    message.channel.name !== "chat-gpt"
  ) {
    return;
  }

  console.log(`Received message from ${message.author.tag}`);

  const isAuthenticated = !!message.member.roles.cache.find(
    (role) => role.name === "homo-sapiens"
  );

  if (isAuthenticated) {
    const forGpt =
      message.mentions.users.size === 1 &&
      !!message.mentions.users.find((user) => user.username === "chat-GPT");

    if (forGpt) {
      console.log(`Accessing ChatGPT`, message);
      if (message.content.includes("!!image")) {
        const response = await axios.post(
          "https://api.openai.com/v1/images/generations",
          {
            prompt: message.content
              .replace(/<[@#!&](.*?)>/g, "")
              .replace(/\!\!image/g, ""),
            n: 1,
            size: "1024x1024",
            response_format: "url",
          },
          {
            headers: {
              Authorization: `Bearer ${process.env.OPENAI_TOKEN}`,
              "Content-Type": "application/json",
            },
          }
        );
        console.log(`Received response as image`);
        const attachment = new AttachmentBuilder(
          response.data.data[0].url
        ).setName("temp.png");
        await message.reply({
          files: [attachment],
          content: "Here is your image",
        });
      } else {
        const response = await axios.post(
          "https://api.openai.com/v1/chat/completions",
          {
            model: "gpt-3.5-turbo",
            messages: [
              {
                role: "user",
                content: message.content.replace(/<[@#!&](.*?)>/g, ""),
              },
            ],
            temperature: 0.7,
          },
          {
            headers: {
              Authorization: `Bearer ${process.env.OPENAI_TOKEN}`,
              "Content-Type": "application/json",
            },
          }
        );
        console.log(`Received response as text`);
        await message.reply(response.data.choices[0]?.message?.content);
      }
    } else {
      await message.reply(
        "If you want to access chatGPT, please mention me in the message"
      );
    }
  } else {
    await message.reply(
      "Please get permission from server admin to get chatGPT access."
    );
  }
});

client.login(process.env.BOT_TOKEN);
