//code reqs
const Discord = require('discord.js');
const Markov = require('node-markov');

//data reqs
const config = require("./config");

//setup
const dc = new Discord.Client();

//main
dc.on('ready', () => {
    console.log(`Client ready! Logged in as ${dc}`)
})