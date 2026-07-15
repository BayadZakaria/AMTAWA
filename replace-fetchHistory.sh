sed -i '/const fetchHistory = async () => {/,/setLoading(false);/c\
  const fetchHistory = async () => {\
    try {\
      if (user.isMock || !supabase) {\
        const hist = JSON.parse(localStorage.getItem(`mock_history_${user.id}`) || `{"scans":[],"meals":[],"fitness":[]}`);\
        setHistoryData(hist);\
        setLoading(false);\
        return;\
      }\
      const { data } = await supabase.from('\''activity_history'\'').select('\''*\'').eq('\''user_id'\'', user.id).order('\''created_at'\'', { ascending: false });\
      const hist: any = { scans: [], meals: [], fitness: [] };\
      if (data) {\
        data.forEach(d => {\
          const item = { ...d.details, date: d.created_at };\
          if (d.activity_type === '\''scan'\'') hist.scans.push(item);\
          if (d.activity_type === '\''meal'\'') hist.meals.push(item);\
          if (d.activity_type === '\''fitness'\'') hist.fitness.push(item);\
        });\
      }\
      setHistoryData(hist);\
    } catch (e) {\
      console.error(e);\
    } finally {\
      setLoading(false);\
    }\
  };' src/components/History.tsx
