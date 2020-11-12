const { Client } = require("discord.js");
const { Manager } = require("erela.js");
 
// Initialize the Discord.JS Client.
const client = new Client();
 
// Initiate the Manager with some options and listen to some events.
client.manager = new Manager({
  // Pass an array of node. Note: You do not need to pass any if you are using the default values (ones shown below).
  nodes: [
    // If you pass a object like so the "host" property is required
    {
      host: "localhost", // Optional if Lavalink is local
      port: 2333, // Optional if Lavalink is set to default
      password: "youshallnotpass", // Optional if Lavalink is set to default
    },
  ],
  // A send method to send data to the Discord WebSocket using your library.
  // Getting the shard for the guild and sending the data to the WebSocket.
  send(id, payload) {
    const guild = client.guilds.cache.get(id);
    if (guild) guild.shard.send(payload);
  },
})
  .on("nodeConnect", node => console.log(`Node ${node.options.identifier} connected`))
  .on("nodeError", (node, error) => console.log(`Node ${node.options.identifier} had an error: ${error.message}`))
  .on("trackStart", (player, track) => {
    client.channels.cache
      .get(player.textChannel)
      .send(`Now playing: ${track.title}`);
  })
  .on("queueEnd", (player) => {
    client.channels.cache
      .get(player.textChannel)
      .send("Queue has ended.");
 
    player.destroy();
  });
 
// Ready event fires when the Discord.JS client is ready.
// Use EventEmitter#once() so it only fires once.
client.once("ready", () => {
  console.log("I am ready!");
  // Initiate the manager.
  client.manager.init(client.user.id);
});
 
// Here we send voice data to lavalink whenever the bot joins a voice channel to play audio in the channel.
client.on("raw", (d) => client.manager.updateVoiceState(d));
 
client.on("message", async (message) => {
  if (message.content.startsWith("!play")) {
    // Note: This example only works for retrieving tracks using a query, such as "Rick Astley - Never Gonna Give You Up".
 
    // Retrieves tracks with your query and the requester of the tracks.
    // Note: This retrieves tracks from youtube by default, to get from other sources you must enable them in application.yml and provide a link for the source.
    // Note: If you want to "search" for tracks you must provide an object with a "query" property being the query to use, and "source" being one of "youtube", "soundcloud".
    const res = await client.manager.search(
      message.content.slice(6),
      message.author
    );
 
    // Create a new player. This will return the player if it already exists.
    const player = client.manager.create({
      guild: message.guild.id,
      voiceChannel: message.member.voice.channel.id,
      textChannel: message.channel.id,
    });
 
    // Connect to the voice channel.
    player.connect();
 
    // Adds the first track to the queue.
    player.queue.add(res.tracks[0]);
    message.channel.send(`Enqueuing track ${res.tracks[0].title}.`);
 
    // Plays the player (plays the first track in the queue).
    // The if statement is needed else it will play the current track again
    if (!player.playing && !player.paused && !player.queue.size)
      player.play();
 
    // For playlists you'll have to use slightly different if statement
    if (
      !player.playing &&
      !player.paused &&
      player.queue.totalSize === res.tracks.length
    )
      player.play();
  }
});
 
client.login("your token");
