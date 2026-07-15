sed -i 's/import { translations, Language } from '\''..\/translations'\'';/import { translations, Language } from '\''..\/translations'\'';\nimport { supabase } from '\''..\/lib\/supabase'\'';/g' src/components/Scanner.tsx
sed -i '/setResult(data);/a\
      if (user.isMock || !supabase) {\
        const hist = JSON.parse(localStorage.getItem(`mock_history_${user.id}`) || `{"scans":[],"meals":[],"fitness":[]}`);\
        hist.scans.push({ ...data, date: new Date().toISOString() });\
        localStorage.setItem(`mock_history_${user.id}`, JSON.stringify(hist));\
      } else {\
        await supabase.from('\''activity_history'\'').insert({\
          user_id: user.id,\
          activity_type: '\''scan'\'',\
          details: data\
        });\
      }' src/components/Scanner.tsx
