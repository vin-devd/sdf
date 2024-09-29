const { Client, ActivityType, Collection, Component, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js')
require('dotenv').config()
const token = process.env.TOKEN;
const clientId = process.env.CLIENTID;
const {REST} = require('@discordjs/rest')
const mongoose = require('mongoose')
const {Routes} = require('discord-api-types/v9');
const { log } = require('console');
const { readdirSync } = require('fs');
const fileSchema = require('./schema/azanSchema');
const moment = require('moment-timezone');
const { PrayerTimes, CalculationMethod } = require('adhan'); 
const { calculatePrayerTimes } = require('./cmds/azan');
mongoose.connect('mongodb+srv://dfhh:YeqlAeFzhChutTbL@id.wy06g.mongodb.net/', { }).then(() => {
    console.log('mongo connected bbbbbbbbbbbb')
})
const bot = new Client({
    intents: 65123,
})
bot.login(token)
const commands = []
bot.commands = new Collection()
const files = readdirSync('./cmds').filter(f => f.endsWith('.js'))
for(let file of files){
    const command = require(`./cmds/${file}`)
    commands.push(command.data.toJSON())
    bot.commands.set(command.data.name, command)
}

(async() => {
    try{
        const rest = new REST({version: "9"}).setToken(token)
        rest.put(
            Routes.applicationCommands(clientId), {
                body: commands
            }
        )
    }catch(Err){
        log(Err)
    }
})()

bot.on('interactionCreate', async(int) => {
    const command = bot.commands.get(int.commandName)
    if(int.isCommand()){
        if(command){
        try{
            await command.execute(int, bot)
        }catch(err){
            return log(err)
        }
     }
    }
})
bot.on('ready', async() => {
    bot.user.setPresence({activities: [{name: 'Go...', type: ActivityType.Watching}], status: 'dnd'})
    log('ready')
})

bot.on('interactionCreate', async(int) => {
    if(int.isButton()){
    if(int.customId.startsWith('updateButton_')){
        const channel = int.customId.split('_')[1]
        const country = int.customId.split('_')[2]
        const channelId = bot.channels.cache.get(channel)
        const DataSchema = require('./schema/azanSchema')
        const data = await DataSchema.findOne({guildId: int.guildId})

        const ButtonUpdate = new ButtonBuilder()
        .setCustomId(`updateButto`)
        .setLabel('تحديث')
        .setDisabled(true)
        .setStyle(ButtonStyle.Primary)

        const ButtonDelete = new ButtonBuilder()
        .setCustomId('deleteButto')
        .setLabel('حذف')
        .setDisabled(true)
        .setStyle(ButtonStyle.Danger)

        const act = new ActionRowBuilder()
        .addComponents(ButtonDelete, ButtonUpdate)
        if(data){
            await int.update({components: [act], content: 'تم تحديث البيانات ✅'}).then(() => {
                DataSchema.updateOne({channelId: `${channelId}`, country: `${country}`})

            })
        }
    }else if(int.customId === 'deleteButton'){
        const DataSchema = require('./schema/azanSchema')
        const data = await DataSchema.findOne({guildId: int.guildId})
        
        const ButtonUpdate = new ButtonBuilder()
        .setCustomId(`updateButto`)
        .setLabel('تحديث')
        .setDisabled(true)
        .setStyle(ButtonStyle.Primary)

        const ButtonDelete = new ButtonBuilder()
        .setCustomId('deleteButto')
        .setLabel('حذف')
        .setDisabled(true)
        .setStyle(ButtonStyle.Danger)

        const act = new ActionRowBuilder()
        .addComponents(ButtonDelete, ButtonUpdate)
        if(data){
            await int.update({components: [act], content: ' تم حذف البيانات✅'})
            await DataSchema.deleteOne({guildId: int.guildId, channelId: data.channelId, country: data.country})

        }
    }
   }
})
function pray(coordinates, timezone) {
    const date = moment().tz(timezone).toDate();
    const parm = CalculationMethod.MuslimWorldLeague();
    const Ptime = new PrayerTimes(coordinates, date, parm);

    return {
        fajr: moment(Ptime.fajr).tz(timezone).format('HH:mm'),
        dhuhr: moment(Ptime.dhuhr).tz(timezone).format('HH:mm'),
        asr: moment(Ptime.asr).tz(timezone).format('HH:mm'),
        maghrib: moment(Ptime.maghrib).tz(timezone).format('HH:mm'),
        isha: moment(Ptime.isha).tz(timezone).format('HH:mm'),
    };
}
const countries = {
    'Egypt': { lat: 30.033333, lon: 31.233334, timezone: 'Africa/Cairo' },
    'Saudi Arabia': { lat: 24.7136, lon: 46.6753, timezone: 'Asia/Riyadh' },
    'UAE': { lat: 25.276987, lon: 55.296249, timezone: 'Asia/Dubai' },
    'Algeria': { lat: 36.737232, lon: 3.086472, timezone: 'Africa/Algiers' },
    'Jordan': { lat: 31.963158, lon: 35.930359, timezone: 'Asia/Amman' },
    'Morocco': { lat: 31.791702, lon: -7.09262, timezone: 'Africa/Casablanca' }, // تأكد من هذا
    'Iraq': { lat: 33.3152, lon: 44.3661, timezone: 'Asia/Baghdad' },
    'Kuwait': { lat: 29.3759, lon: 47.9774, timezone: 'Asia/Kuwait' },
    'Qatar': { lat: 25.276987, lon: 51.521042, timezone: 'Asia/Qatar' },
    'Tunisia': { lat: 36.806389, lon: 10.181667, timezone: 'Africa/Tunis' },
    'Bahrain': { lat: 26.0667, lon: 50.5577, timezone: 'Asia/Bahrain' },
    'Lebanon': { lat: 33.8547, lon: 35.8623, timezone: 'Asia/Beirut' },
    'Sudan': { lat: 15.5007, lon: 32.5599, timezone: 'Africa/Khartoum' },
    'Libya': { lat: 32.8872, lon: 13.1913, timezone: 'Africa/Tripoli' },
    'Palestine': { lat: 31.9522, lon: 35.2332, timezone: 'Asia/Gaza' },
    'Syria': { lat: 33.5138, lon: 36.2765, timezone: 'Asia/Damascus' },
    'Oman': { lat: 23.6100, lon: 58.5400, timezone: 'Asia/Muscat' },
    'Mauritania': { lat: 18.0735, lon: -15.9582, timezone: 'Africa/Nouakchott' },
    'Somalia': { lat: 5.1521, lon: 46.1996, timezone: 'Africa/Mogadishu' },
    'Djibouti': { lat: 11.8251, lon: 42.5903, timezone: 'Africa/Djibouti' },
    'Comoros': { lat: -11.6455, lon: 43.3333, timezone: 'Indian/Comoro' },
    'Yemen': { lat: 15.5527, lon: 48.5164, timezone: 'Asia/Aden' },
};

setInterval(async () => {
    const guilds = await fileSchema.find();
    guilds.forEach(async (dataFile) => {
        const { guildId, channelId, country } = dataFile;
        const guild = bot.guilds.cache.get(guildId);
        const channel = bot.channels.cache.get(channelId);

        if (channel) {
            const { lat, lon, timezone } = countries[country] || {};

            if (!lat || !lon || !timezone) {
                console.error(`الدولة "${country}" غير معرفة في القائمة.`);
                return;
            }
            if(!guild && !channel) return;

            const prayerTimes = pray({ lat, lon }, timezone)
            const currentTime = moment().tz(timezone).format('HH:mm');
            const prayerKeys = Object.keys(prayerTimes);

            for (const prayer of prayerKeys) {
                if (currentTime === prayerTimes[prayer]) {
                    const prayerMessage = `⏰ حان الآن موعد أذان ${prayer} حسب توقيت دولة ${country}.`;
                    await channel.send(prayerMessage);
                }
            }
        }
    });
}, 60000);