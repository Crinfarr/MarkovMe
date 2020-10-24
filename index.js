//code reqs
const Discord = require('discord.js');
const Markov = require('node-markov-generator');
const fs = require('fs');
//data reqs
const config = require("./config");

//setup
const dc = new Discord.Client();
let box = {}, tgen, sentence = "", isolated_servers = [];

try {
    isolated_servers = (fs.existsSync('./data/isolated_servers.json'))? JSON.parse(fs.readFileSync('./data/isolated_servers.json')) : [];
}
catch (err) {
    isolated_servers = [];
}

try{
    box = (fs.existsSync('./data/userdata.json'))? JSON.parse(fs.readFileSync('./data/userdata.json')) : {};
}
catch (err) {
    box = {};
}
var usrmsgs = [];

function isolate(guildID, msg) {
    if(isolated_servers["servers"].includes(guildID)) {
        var index = isolated_servers["servers"].indexOf(guildID);
        isolated_servers["servers"].splice(index, 1);
        msg.channel.send(':unlock: Server removed from isolation');
        save();
    }
    else {
        isolated_servers["servers"].push(guildID);
        msg.channel.send(':lock: Server isolated')
        save();
    }
}

//main

function generateMessage(msg, authorID, context = 0.5) {
    if (!isolated_servers["servers"].includes(msg.guild.id)) {
        tgen = new Markov.TextGenerator(box[authorID]);
        sentence = tgen.generateSentence({'contextUsageDegree':context});
        console.log(sentence + `\nsent in ${msg.guild.name}`);
        msg.channel.send(sentence + `\n-<@${authorID}>`); 
    }
    else {
        tgen = new Markov.TextGenerator(isolated_servers[msg.guild.id][authorID]);
        sentence = tgen.generateSentence({'contextUsageDegree':context});
        console.log(sentence + `\n sent in ${msg.guild.name}`);
        msg.channel.send(sentence + `\n-<@${authorID}>`);
    }
}

function logMessages(msg) {
    if (!isolated_servers["servers"].includes(msg.guild.id)){
        usrmsgs = (box[msg.author.id] == undefined) ? [] : box[msg.author.id];
        usrmsgs.push(msg.content);
        box[msg.author.id] = usrmsgs;
    }
    else {
        if (isolated_servers[msg.guild.id] == undefined) {
            isolated_servers[msg.guild.id] = {}
        }
        if (isolated_servers[msg.guild.id][msg.author.id] == undefined) {
            isolated_servers[msg.guild.id][msg.author.id] = [];
        }

        isolated_servers[msg.guild.id][msg.author.id].push(msg.content);
        return;
    }
}

function save() {
    fs.writeFileSync('./data/userdata.json', JSON.stringify(box));
    fs.writeFileSync('./data/isolated_servers.json', JSON.stringify(isolated_servers));
}

dc.on('ready', () => {
    console.log(`Client ready! Logged in as ${dc.user.tag}`);
    dc.user.setActivity("with your minds | %help", {type:"STREAMING"});
});

dc.on('message', async msg => {
    if (msg.author.bot) return;
    switch (msg.content.split(' ')[0]) {
        case '%ping':
            msg.channel.send('pong!');
            return;
        case '%drop':
            if (config.debug) console.log(box+'\n'+isolated_servers);
            return;
        case '%save':
            if (msg.member.guild.me.hasPermission('ADMINISTRATOR')) {
                save();
                msg.channel.send('`\u2713 File saved`');
            }
            return;
        case '%markov':
            switch(msg.content.split(' ')[1]){
                case 'me':
                    generateMessage(msg, msg.author.id);
                    return;
                case 'chaos':
                    switch (msg.content.split(' ')[2]){
                        case 'me':
                            generateMessage(msg, msg.author.id, 0.2);
                            return;
                        default:
                            if (msg.content.split(' ')[1] == undefined) {
                                msg.channel.send(":x: Invalid command!");
                                return;
                            }
                            generateMessage(msg, msg.content.split(' ')[3].replace(/[<@!>]/g, ''), 0.2);
                            return;
                    }
                    // eslint-disable-next-line no-unreachable
                    return;//pretty
                default:
                    if (msg.content.split(' ')[1] == undefined) {
                        msg.channel.send(":x: Invalid command!");
                        return;
                    }
                    generateMessage(msg, msg.content.split(' ')[1].replace(/[<@!>]/g, ''));
                    /* tgen = new generate.TextGenerator(box[msg.content.split(' ')[1].replace(/[<@!>]/g, '')])
                    sentence = tgen.generateSentence();
                    console.log(sentence+`\nsent in ${msg.guild.name}`)
                    msg.channel.send(sentence+`\n-${msg.content.split(' ')[1]}`) */
                    return;
            }
            // eslint-disable-next-line no-unreachable
            return;//it doesn't look pretty if I delete this, even though it will never get here.
        case '%help':
            //todo: help function here
            msg.channel.send("Help!\n**%help**: Hello!\n\n**%markov**:\n    me: Simulates you based off previous messages\n    @[someone]: Simulates someone based off their previous messages\n    chaos [me/@someone]: Simulates a person, with no regard for grammar.\n\n**%ping**: pong!\n\n***ADMIN COMMANDS***\n**%isolate**: Toggles Isolation, keeping user data locked here.\n\n**%save**: Saves all user data.  Executed every 10 minutes automatically.");
            return;
        case '%isolate':
            if (msg.member.guild.me.hasPermission('ADMINISTRATOR')){
                isolate(msg.guild.id, msg);
            }
            return;
        default:
            break;
    }
    logMessages(msg);

    return;
});

dc.login(config.bot.token);
setInterval(() => {save()}, 600000);