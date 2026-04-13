'use client'
import { useState, useRef } from 'react'
import styles from './page.module.css'

const HASHTAGS = ['朝ごはん','昼ごはん','夜ごはん','ラーメン','寿司','カフェ','居酒屋','スイーツ','定食','ランチ','ディナー','自炊','焼肉','パスタ','カレー']

const SAMPLE_POSTS = [
  { id:'s1', user:'yuki_eats', caption:'渋谷で行列ラーメン！待った甲斐あり😋', tags:['昼ごはん','ラーメン'], emoji:'🍜', bg:'#fff0e8', shop:'麺屋しずる', city:'渋谷区', addr:'東京都渋谷区円山町1-5', likes:24, time:'2時間前' },
  { id:'s2', user:'taro_gohan', caption:'朝から手作りサラダボウル。野菜たっぷり！', tags:['朝ごはん','自炊'], emoji:'🥗', bg:'#f0f8e8', shop:'', city:'', addr:'', likes:17, time:'4時間前' },
  { id:'s3', user:'miso_lover', caption:'地元の老舗で夜ごはん。お刺身が絶品でした🐟', tags:['夜ごはん','寿司'], emoji:'🍣', bg:'#e8f0ff', shop:'魚菜 とみや', city:'新宿区', addr:'東京都新宿区西新宿3-1-12', likes:41, time:'昨日' },
  { id:'s4', user:'cafe_hana', caption:'お気に入りカフェでモーニング☕ 最高の一杯', tags:['朝ごはん','カフェ'], emoji:'☕', bg:'#fff8e0', shop:'Café Bloom', city:'目黒区', addr:'東京都目黒区自由が丘1-8-6', likes:33, time:'昨日' },
]

export default function Home() {
  const [tab, setTab] = useState('home')
  const [posts, setPosts] = useState([])
  const [likes, setLikes] = useState({})
  const [saves, setSaves] = useState({})
  const [filterTag, setFilterTag] = useState('全て')
  const [imgData, setImgData] = useState(null)
  const [imgFile, setImgFile] = useState(null)
  const [analyzing, setAnalyzing] = useState(false)
  const [analyzeResult, setAnalyzeResult] = useState(null)
  const [selTags, setSelTags] = useState([])
  const [caption, setCaption] = useState('')
  const [shopName, setShopName] = useState('')
  const [shopCity, setShopCity] = useState('')
  const [shopAddr, setShopAddr] = useState('')
  const fileRef = useRef()

  const allPosts = [...posts, ...SAMPLE_POSTS]
  const filteredPosts = filterTag === '全て' ? allPosts : allPosts.filter(p => p.tags?.includes(filterTag))
  const savedPosts = allPosts.filter(p => saves[p.id])

  async function onFileChange(e) {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = async (ev) => {
      const data = ev.target.result
      setImgData(data)
      setImgFile(file)
      setAnalyzeResult(null)
      setAnalyzing(true)
      try {
        const base64 = data.split(',')[1]
        const res = await fetch('/api/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imageBase64: base64, mediaType: file.type })
        })
        const result = await res.json()
        setAnalyzeResult(result)
      } catch (err) {
        setAnalyzeResult({ error: err.message })
      }
      setAnalyzing(false)
    }
    reader.readAsDataURL(file)
  }

  function toggleTag(tag) {
    setSelTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag])
  }

  function toggleLike(id) {
    setLikes(prev => ({ ...prev, [id]: !prev[id] }))
  }

  function toggleSave(id) {
    setSaves(prev => ({ ...prev, [id]: !prev[id] }))
  }

  function submitPost() {
    const newPost = {
      id: 'p' + Date.now(),
      user: 'あなた',
      caption,
      tags: selTags,
      emoji: ['🍜','🥗','🍛','🍱','🍣','☕'][Math.floor(Math.random()*6)],
      bg: '#fff0e8',
      imgData,
      shop: shopName,
      city: shopCity,
      addr: shopAddr,
      likes: 0,
      time: '今'
    }
    setPosts(prev => [newPost, ...prev])
    setImgData(null); setImgFile(null); setAnalyzeResult(null)
    setSelTags([]); setCaption(''); setShopName(''); setShopCity(''); setShopAddr('')
    if (fileRef.current) fileRef.current.value = ''
    setTab('home')
  }

  const canPost = analyzeResult && !analyzeResult.error && analyzeResult.food_percent >= 60 && selTags.length > 0

  return (
    <div className={styles.app}>
      {/* ヘッダー */}
      <header className={styles.header}>
        <div className={styles.logo}><span className={styles.dot}>●</span> MealLog</div>
        <div className={styles.headerRight}>
          <span className={styles.tagline}>ご飯専用SNS</span>
        </div>
      </header>

      {/* タブ */}
      {tab !== 'post' && (
        <nav className={styles.tabs}>
          {['home','nearby','saved'].map(t => (
            <button key={t} className={`${styles.tab} ${tab===t?styles.active:''}`} onClick={() => setTab(t)}>
              {t==='home'?'ホーム':t==='nearby'?'近くのお店':'保存済み'}
            </button>
          ))}
        </nav>
      )}

      {/* ホーム */}
      {tab === 'home' && (
        <div>
          <div className={styles.filterRow}>
            {['全て',...HASHTAGS.slice(0,8)].map(tag => (
              <button key={tag} className={`${styles.pill} ${filterTag===tag?styles.pillOn:''}`} onClick={() => setFilterTag(tag)}>
                {tag==='全て'?'全て':'#'+tag}
              </button>
            ))}
          </div>
          <div className={styles.feed}>
            {filteredPosts.length === 0 && <p className={styles.empty}>まだ投稿がありません</p>}
            {filteredPosts.map(p => (
              <PostCard key={p.id} post={p} liked={likes[p.id]} saved={saves[p.id]} onLike={() => toggleLike(p.id)} onSave={() => toggleSave(p.id)} />
            ))}
          </div>
        </div>
      )}

      {/* 近くのお店 */}
      {tab === 'nearby' && (
        <div className={styles.nearbyWrap}>
          <div className={styles.mapPlaceholder}>
            <div style={{fontSize:36}}>🗺️</div>
            <p>GPS許可で近くの飲食店を表示</p>
            <button className={styles.gpsBtn} onClick={() => alert('本番環境でGPSが使えます')}>現在地を取得</button>
          </div>
          {[
            {name:'麺屋しずる',type:'ラーメン',dist:'120m',emoji:'🍜'},
            {name:'すし処 はな',type:'寿司',dist:'280m',emoji:'🍣'},
            {name:'Café Bloom',type:'カフェ',dist:'350m',emoji:'☕'},
            {name:'焼肉 金城',type:'焼肉',dist:'420m',emoji:'🥩'},
            {name:'定食屋 山田',type:'定食',dist:'510m',emoji:'🍱'},
          ].map(s => (
            <div key={s.name} className={styles.nearbyItem} onClick={() => { setShopName(s.name); setTab('post') }}>
              <div className={styles.nearbyIcon}>{s.emoji}</div>
              <div className={styles.nearbyInfo}>
                <div className={styles.nearbyName}>{s.name}</div>
                <div className={styles.nearbyMeta}>{s.type}</div>
              </div>
              <div className={styles.nearbyDist}>{s.dist}</div>
            </div>
          ))}
        </div>
      )}

      {/* 保存済み */}
      {tab === 'saved' && (
        <div>
          <div className={styles.sectionHead}>保存した投稿</div>
          {savedPosts.length === 0
            ? <p className={styles.empty}>♡ボタンで保存できます</p>
            : <div className={styles.savedGrid}>
                {savedPosts.map(p => (
                  <div key={p.id} className={styles.savedCell} style={{background:p.bg}}>
                    {p.imgData ? <img src={p.imgData} style={{width:'100%',height:'100%',objectFit:'cover'}} /> : <span style={{fontSize:36}}>{p.emoji}</span>}
                    <div className={styles.savedOverlay}>{p.tags?.map(t=>'#'+t).join(' ')}</div>
                  </div>
                ))}
              </div>
          }
        </div>
      )}

      {/* 投稿画面 */}
      {tab === 'post' && (
        <div className={styles.postWrap}>
          <div className={styles.postHeader}>
            <button className={styles.backBtn} onClick={() => setTab('home')}>← 戻る</button>
            <span className={styles.postTitle}>新しい投稿</span>
          </div>

          <input ref={fileRef} type="file" accept="image/*" style={{display:'none'}} onChange={onFileChange} />

          {!imgData
            ? <div className={styles.uploadZone} onClick={() => fileRef.current?.click()}>
                <div style={{fontSize:32}}>📷</div>
                <p>タップして写真を選ぶ</p>
                <p style={{fontSize:11,marginTop:4,color:'#999'}}>AIがご飯かどうか自動確認</p>
              </div>
            : <div className={styles.previewWrap}>
                <img src={imgData} className={styles.previewImg} />
                <button className={styles.removeBtn} onClick={() => { setImgData(null); setAnalyzeResult(null); if(fileRef.current) fileRef.current.value='' }}>✕</button>
              </div>
          }

          {analyzing && <div className={styles.aiBadge} style={{background:'#f5f5f5',color:'#888'}}>🔍 AIが確認中...</div>}
          {analyzeResult && !analyzeResult.error && (
            <div className={styles.aiBadge} style={{background: analyzeResult.food_percent>=60?'#e8f5e0':'#fce8e8', color: analyzeResult.food_percent>=60?'#3b7011':'#a32d2d'}}>
              {analyzeResult.food_percent>=60?'✅':'🚫'} 食べ物の割合: {analyzeResult.food_percent}%　{analyzeResult.reason}
            </div>
          )}
          {analyzeResult?.error && <div className={styles.aiBadge} style={{background:'#fce8e8',color:'#a32d2d'}}>❌ エラー: {analyzeResult.error}</div>}

          <textarea className={styles.captionArea} rows={3} placeholder="今日の一食について書いてみよう..." value={caption} onChange={e => setCaption(e.target.value)} />

          <div className={styles.label}>#ハッシュタグ（複数選択可）</div>
          <div className={styles.htagSelect}>
            {HASHTAGS.map(tag => (
              <button key={tag} className={`${styles.htagOpt} ${selTags.includes(tag)?styles.htagOn:''}`} onClick={() => toggleTag(tag)}>#{tag}</button>
            ))}
          </div>

          <div className={styles.label}>📍 お店の場所（任意）</div>
          <div className={styles.locRow}>
            <input className={styles.locInput} placeholder="お店の名前" value={shopName} onChange={e=>setShopName(e.target.value)} />
            <input className={styles.locInput} placeholder="市区町村" style={{maxWidth:120}} value={shopCity} onChange={e=>setShopCity(e.target.value)} />
          </div>
          <input className={styles.locInput} style={{width:'100%',marginBottom:16}} placeholder="住所（例：東京都渋谷区○○1-2-3）" value={shopAddr} onChange={e=>setShopAddr(e.target.value)} />

          <button className={styles.submitBtn} disabled={!canPost} onClick={submitPost}>投稿する</button>
        </div>
      )}

      {/* 下部ナビ */}
      <nav className={styles.bottomNav}>
        <button className={`${styles.navItem} ${tab==='home'?styles.navActive:''}`} onClick={() => setTab('home')}>
          <span style={{fontSize:20}}>🏠</span><span className={styles.navLabel}>ホーム</span>
        </button>
        <button className={`${styles.navItem} ${tab==='nearby'?styles.navActive:''}`} onClick={() => setTab('nearby')}>
          <span style={{fontSize:20}}>📍</span><span className={styles.navLabel}>近く</span>
        </button>
        <button className={styles.fab} onClick={() => setTab('post')}>＋</button>
        <button className={`${styles.navItem} ${tab==='saved'?styles.navActive:''}`} onClick={() => setTab('saved')}>
          <span style={{fontSize:20}}>🔖</span><span className={styles.navLabel}>保存</span>
        </button>
        <button className={styles.navItem} onClick={() => alert('プロフィール機能は近日実装予定！')}>
          <span style={{fontSize:20}}>👤</span><span className={styles.navLabel}>マイページ</span>
        </button>
      </nav>
    </div>
  )
}

function PostCard({ post, liked, saved, onLike, onSave }) {
  return (
    <div style={{background:'#fff',borderBottom:'0.5px solid #eee'}}>
      <div style={{display:'flex',alignItems:'center',gap:10,padding:'12px 14px 8px'}}>
        <div style={{width:36,height:36,borderRadius:'50%',background:'#faece7',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:500,fontSize:13}}>
          {post.user.slice(0,2).toUpperCase()}
        </div>
        <div>
          <div style={{fontSize:14,fontWeight:500}}>@{post.user}</div>
          <div style={{fontSize:12,color:'#999'}}>{post.time}</div>
        </div>
      </div>
      {post.imgData
        ? <img src={post.imgData} style={{width:'100%',maxHeight:320,objectFit:'cover',display:'block'}} />
        : <div style={{width:'100%',height:200,background:post.bg,display:'flex',alignItems:'center',justifyContent:'center',fontSize:56}}>{post.emoji}</div>
      }
      <div style={{padding:'10px 14px'}}>
        <div style={{fontSize:14,lineHeight:1.5,marginBottom:8}}>{post.caption}</div>
        {post.tags?.length > 0 && (
          <div style={{display:'flex',flexWrap:'wrap',gap:6,marginBottom:8}}>
            {post.tags.map(t => <span key={t} style={{fontSize:12,background:'#e6f1fb',color:'#185fa5',padding:'3px 8px',borderRadius:20}}>#{t}</span>)}
          </div>
        )}
        {post.shop && (
          <div style={{fontSize:12,color:'#888',marginBottom:8,cursor:'pointer'}} onClick={() => post.addr && alert(post.addr)}>
            📍 {post.shop}{post.city && ' · '+post.city}
          </div>
        )}
        <div style={{display:'flex',borderTop:'0.5px solid #eee',paddingTop:8,gap:4}}>
          <button onClick={onLike} style={{flex:1,background:'none',border:'none',cursor:'pointer',padding:'6px 0',fontSize:13,color:liked?'#e24b4a':'#888'}}>
            {liked?'❤️':'🤍'} {(post.likes||0)+(liked?1:0)}
          </button>
          <button onClick={onSave} style={{flex:1,background:'none',border:'none',cursor:'pointer',padding:'6px 0',fontSize:13,color:saved?'#d85a30':'#888'}}>
            {saved?'🔖':'📌'} 保存
          </button>
          <button style={{flex:1,background:'none',border:'none',cursor:'pointer',padding:'6px 0',fontSize:13,color:'#888'}} onClick={() => alert('シェア機能は近日実装！')}>
            ↗ シェア
          </button>
        </div>
      </div>
    </div>
  )
}
