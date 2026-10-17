const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');

const FALLBACK_NEWS = [
  {
    id: 1,
    title: 'NMC CITY Season 4: Tricky Trials Update',
    summary: 'ទីក្រុង NMC CITY Season 4 បានបើកដំណើរការជាផ្លូវការជាមួយមុខងារថ្មីៗ និងប្រព័ន្ធសេដ្ឋកិច្ចថ្មី!',
    content: 'សូមស្វាគមន៍មកកាន់ Season 4 នៃ NMC CITY RP! ការអាប់ដេតនេះរួមបញ្ចូលទាំងរថយន្តថ្មី ប្រព័ន្ធសេដ្ឋកិច្ចថ្មី និង Minecraft 1.21.1 PvP Server ជាមួយ Auto-Mod Synchronizer។',
    category: 'UPDATE',
    banner_url: 'https://launchercontent.mojang.com/v2/backgrounds/1.21.1.jpg',
    author: 'NMC High Command',
    created_at: new Date().toISOString()
  },
  {
    id: 2,
    title: 'Minecraft PvP Tournament 1.21.1',
    summary: 'ការប្រកួត PvP ប្រចាំសប្ដាហ៍លើម៉ាស៊ីនបម្រើ Minecraft 1.21.1 ជាមួយរង្វាន់ជាច្រើន!',
    content: 'ការប្រកួតប្រជែងដណ្ដើមពានរង្វាន់ប្រចាំសប្ដាហ៍នៅថ្ងៃអាទិត្យ វេលាម៉ោង ៧:០០ យប់។ គាំទ្រប្រព័ន្ធ Reach Display, CPS Tracking, និង Durability HUD ពេញលេញ។',
    category: 'EVENT',
    banner_url: 'https://launchercontent.mojang.com/v2/backgrounds/1.21.1.jpg',
    author: 'Tournament Director',
    created_at: new Date().toISOString()
  }
];

router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('news')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);

    if (error || !data || data.length === 0) {
      return res.json({ success: true, news: FALLBACK_NEWS });
    }

    return res.json({ success: true, news: data });
  } catch {
    return res.json({ success: true, news: FALLBACK_NEWS });
  }
});

module.exports = router;
