const { PrayerTimes, CalculationMethod } = require('adhan');
const mongoose = require('mongoose');
const fileSchema = require('../schema/azanSchema');
const moment = require('moment-timezone');
const { PermissionsBitField, SlashCommandBuilder, ChannelType, EmbedBuilder, Colors, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js');
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


module.exports = {
    data: new SlashCommandBuilder()
        .setName('praytimeset')
        .setDescription('Set a channel to send prayer notifications')
        .addStringOption(option => 
            option.setName('country')
                .setDescription('Select your country to get prayer times')
                .setRequired(true)
                .addChoices(
                    { name: 'مصر', value: 'Egypt' },
                    { name: 'السعودية', value: 'Saudi Arabia' },
                    { name: 'الامارات', value: 'UAE' },
                    { name: 'الجزائر', value: 'Algeria' },
                    { name: 'الاردن', value: 'Jordan' },
                    { name: 'المغرب', value: 'Morocco' },
                    { name: 'العراق', value: 'Iraq' },
                    { name: 'الكويت', value: 'Kuwait' },
                    { name: 'قطر', value: 'Qatar' },
                    { name: 'تونس', value: 'Tunisia' },
                    { name: 'البحرين', value: 'Bahrain' },
                    { name: 'لبنان', value: 'Lebanon' },
                    { name: 'السودان', value: 'Sudan' },
                    { name: 'ليبيا', value: 'Libya' },
                    { name: 'فلسطين', value: 'Palestine' },
                    { name: 'سوريا', value: 'Syria' },
                    { name: 'عمان', value: 'Oman' },
                    { name: 'موريتانيا', value: 'Mauritania' },
                    { name: 'الصومال', value: 'Somalia' },
                    { name: 'جيبوتي', value: 'Djibouti' },
                    { name: 'جزء القمر', value: 'Comoros' },
                    { name: 'اليمن', value: 'Yemen' },
                ))
        .addChannelOption(option => 
            option.setName('channel')
                .setDescription('Select the channel you want to set')
                .addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement)
                .setRequired(false)),
    
    execute: async (int) => {
        await int.deferReply();
        const channel = int.options.getChannel('channel') || int.channel;
        const country = int.options.getString('country');
        const bot = int.guild.members.me;
        const { lat, lon, timezone } = countries[country];
        if (!int.member.permissions.has(PermissionsBitField.Flags.ManageChannels)) {
            await int.deleteReply();
            return int.followUp({ content: 'لا تملك صلاحيات كافية!' });
        }

        if (!bot.permissionsIn(channel).has(PermissionsBitField.Flags.ViewChannel)) {
            return int.editReply({ content: 'لا أستطيع رؤية هذه القناة!' });
        }

        const dataFile = await fileSchema.findOne({ guildId: int.guild.id });
        if (dataFile) {
            const embed = new EmbedBuilder()
                .setTitle('يوجد بيانات الخادم بالفعل')
                .setDescription('هل تريد تحديث البيانات ام حذفها؟')
                .setColor(Colors.DarkerGrey)
                .setThumbnail(int.guild.iconURL());

            const ButtonUpdate = new ButtonBuilder()
                .setCustomId(`updateButton_${channel.id}_${country}`)
                .setLabel('تحديث')
                .setStyle(ButtonStyle.Primary);

            const ButtonDelete = new ButtonBuilder()
                .setCustomId('deleteButton')
                .setLabel('حذف')
                .setStyle(ButtonStyle.Danger);

            const act = new ActionRowBuilder()
                .addComponents(ButtonDelete, ButtonUpdate);
            await int.deleteReply();
            return await int.followUp({ embeds: [embed], ephemeral: true, components: [act] });
        }

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
        const prayerTimes = pray({ lat, lon }, timezone);

        await fileSchema.create({ guildId: int.guildId, channelId: channel.id , country: `${country}`});
        await int.editReply(`تم تعيين قناة <#${channel.id}> لإرسال إشعارات الصلاة لدولة ${country}.`);

    }
};
