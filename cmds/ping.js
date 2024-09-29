const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ping')
        .setDescription('يعرض سرعة استجابة البوت'),

    async execute(int, bot) {
        const startTime = Date.now();
        const response = await int.reply({ content: 'جارٍ قياس الاستجابة...', fetchReply: true, ephemeral:true });
        const endTime = Date.now();
        
        const latency = endTime - startTime;
        const apiLatency = bot.ws.ping;
        
        const embed = new EmbedBuilder()
            .setTitle('سرعة استجابة البوت')
            .setColor('#00FF00')
            .addFields(
                { name: 'زمن الاستجابة', value: `${latency} مللي ثانية`, inline: true },
                { name: 'زمن API', value: `${apiLatency} مللي ثانية`, inline: true }
            )
            .setTimestamp();

        await int.editReply({ content: 'تم قياس الاستجابة:', embeds: [embed] });
    }
};
