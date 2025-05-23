import { useState, useEffect } from 'react';
import axios from 'axios';
import styles from '../styles/Home.module.css';
import Image from 'next/image';

export default function Home() {
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [filter, setFilter] = useState('latestUpdate'); // Set default to latestUpdate
  const [searchQuery, setSearchQuery] = useState('');
  const [availableTags, setAvailableTags] = useState([]);
  const [selectedTags, setSelectedTags] = useState([]);
  const [logoText, setLogoText] = useState("BC");
const [logoTransform, setLogoTransform] = useState("translateY(0)");
const [logoOpacity, setLogoOpacity] = useState(1);


  // GitHub config
  const repoConfig = {
    owner: process.env.NEXT_PUBLIC_GITHUB_OWNER,
    repo: process.env.NEXT_PUBLIC_GITHUB_REPO,
    path: process.env.NEXT_PUBLIC_GITHUB_FILE_PATH || 'data.json',
    branch: process.env.NEXT_PUBLIC_GITHUB_BRANCH || 'main',
    token: process.env.NEXT_PUBLIC_GITHUB_TOKEN,
  };

  // Fetch data with proper error handling
  const fetchData = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get(
        `https://api.github.com/repos/${repoConfig.owner}/${repoConfig.repo}/contents/${repoConfig.path}`,
        {
          headers: {
            Authorization: `token ${repoConfig.token}`,
            Accept: 'application/vnd.github.v3+json'
          }
        }
      );

      const content = JSON.parse(atob(response.data.content));
      setItems(content.items || []);
    } catch (error) {
      console.error('Failed to fetch data:', error);
      setItems([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch tags
  const fetchTags = async () => {
    try {
      const response = await axios.get(
        `https://api.github.com/repos/${repoConfig.owner}/${repoConfig.repo}/contents/tag.json`,
        {
          headers: {
            Authorization: `token ${repoConfig.token}`,
            Accept: 'application/vnd.github.v3+json'
          }
        }
      );
      const content = JSON.parse(atob(response.data.content));
      setAvailableTags(content);
    } catch (error) {
      console.error('Failed to fetch tags:', error);
      setAvailableTags(["daily", "WL", "retro", "testnet"]); // Fallback
    }
  };

  // Add this useEffect hook to your component
useEffect(() => {
  const line = document.querySelector(`.${styles.logoLine}`);
  const letters = document.querySelectorAll(`.${styles.logoLetter}`);

  function updateClipPaths() {
    if (!line) return;
    
    const lineX = line.getBoundingClientRect().left;
    letters.forEach(letter => {
      const rect = letter.getBoundingClientRect();
      const percent = Math.min(Math.max((lineX - rect.left) / rect.width, 0), 1) * 100;

      const oldSpan = letter.querySelector(`.${styles.old}`);
      const newSpan = letter.querySelector(`.${styles.new}`);

      if (oldSpan && newSpan) {
        oldSpan.style.clipPath = `inset(0 0 0 ${percent}%)`;
        newSpan.style.clipPath = `inset(0 ${100 - percent}% 0 0)`;
      }
    });
  }

  const animationInterval = setInterval(updateClipPaths, 30);
  return () => clearInterval(animationInterval);
}, []);

  const toggleTagFilter = (tag) => {
    setSelectedTags(prev =>
      prev.includes(tag) 
        ? prev.filter(t => t !== tag) 
        : [...prev, tag]
    );
  };

  const getFilteredItems = () => {
    let filteredItems = [...items];

    // Filter out items where hidden is explicitly true
  filteredItems = filteredItems.filter(item => item.hidden !== true);
    
    // Apply search filter
    if (searchQuery) {
      filteredItems = filteredItems.filter(item => 
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.info && item.info.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (item.steps && item.steps.some(step => 
          step.text.toLowerCase().includes(searchQuery.toLowerCase())
        ))
      );
    }
    
    if (selectedTags.length > 0) {
      filteredItems = filteredItems.filter(item =>
        item.tags && selectedTags.every(tag => item.tags.includes(tag))
      );
    }
    
    return filteredItems;
  };

  // Sort items based on filter
  const getSortedItems = () => {
    const itemsCopy = [...getFilteredItems()];
    switch (filter) {
      case 'latestUpdate':
        return itemsCopy.sort((a, b) => 
          new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt)
        );
      case 'newAdded':
        return itemsCopy.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      case 'oldest':
        return itemsCopy.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
      case 'a-z':
        return itemsCopy.sort((a, b) => a.title.localeCompare(b.title));
      case 'z-a':
        return itemsCopy.sort((a, b) => b.title.localeCompare(a.title));
      default:
        return itemsCopy;
    }
  };

  // Add this component to display sources with icons
const SourceIcon = ({ type }) => {
  const iconMap = {
    web: 'https://raw.githubusercontent.com/abcdrop/airdrop/main/Icon/web_black.png',
    twitter: 'https://raw.githubusercontent.com/abcdrop/airdrop/main/Icon/x_twitter_black.png',
    telegram: 'https://raw.githubusercontent.com/abcdrop/airdrop/main/Icon/telegram_black.png',
    discord: 'https://raw.githubusercontent.com/abcdrop/airdrop/main/Icon/discord_black.png'
  };

  return (
    <Image
      src={iconMap[type] || iconMap.web}
      alt={type}
      width={20}
      height={20}
      className={styles.sourceIcon}
      onError={(e) => {
        e.target.onerror = null;
        e.target.src = iconMap.web;
      }}
    />
  );
};

  // Initial data load
  useEffect(() => {
    fetchData();
    fetchTags();
  }, []);

  return (
    <div className={styles.container}>
      <header className={styles.header}>
  <div className={styles.logoContainer}>
    <div className={styles.logoWord}>
      <span className={styles.logoLetter}><span className={`${styles.old} ${styles.logoStatic}`}>A</span><span className={`${styles.new} ${styles.red}`}>A</span></span>
      <span className={styles.logoLetter}><span className={`${styles.old} ${styles.logoStatic}`}>I</span><span className={`${styles.new} ${styles.red}`}>B</span></span>
      <span className={styles.logoLetter}><span className={`${styles.old} ${styles.logoStatic}`}>R</span><span className={`${styles.new} ${styles.red}`}>C</span></span>
      <span className={styles.logoLetter}><span className={`${styles.old} ${styles.logoStatic}`}>D</span><span className={`${styles.new} ${styles.white}`}>D</span></span>
      <span className={styles.logoLetter}><span className={`${styles.old} ${styles.logoStatic}`}>R</span><span className={`${styles.new} ${styles.white}`}>R</span></span>
      <span className={styles.logoLetter}><span className={`${styles.old} ${styles.logoStatic}`}>O</span><span className={`${styles.new} ${styles.white}`}>O</span></span>
      <span className={styles.logoLetter}><span className={`${styles.old} ${styles.logoStatic}`}>P</span><span className={`${styles.new} ${styles.white}`}>P</span></span>
    </div>
    <div className={styles.logoLine}></div>
  </div>
</header>

      <div className={styles.mainContent}>
        {/* Filter Section */}
        <div className={styles.filterSection}>
          <div className={styles.filterControls}>
            <label>Sort by: </label>
            <select 
  value={filter} 
  onChange={(e) => setFilter(e.target.value)}
  className={styles.filterSelect}
>
  <option value="latestUpdate">Latest Update</option>
  <option value="newAdded">New Added</option>
  <option value="oldest">Oldest</option>
  <option value="a-z">A-Z</option>
  <option value="z-a">Z-A</option>
</select>
          </div>
          
          <div className={styles.searchContainer}>
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={styles.searchInput}
            />
          </div>
          
          <div className={styles.tagFilterContainer}>
            <label>Show only: </label>
            <div className={styles.tagFilterOptions}>
              {availableTags.map(tag => (
                <label key={tag} className={styles.tagFilterLabel}>
                  <input
                    type="checkbox"
                    checked={selectedTags.includes(tag)}
                    onChange={() => toggleTagFilter(tag)}
                    className={styles.tagFilterCheckbox}
                  />
                  <span className={styles.tagFilterText}>{tag}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Display Section */}
        <div className={styles.displaySection}>
          {isLoading ? (
            <div className={styles.loading}>Loading...</div>
          ) : items.length > 0 ? (
            <div className={styles.itemsGrid}>
              {getSortedItems().map((item, index) => (
                <div key={index} className={styles.itemCard}>
                  <h3>{item.title}</h3>
                  
                  {item.tags?.length > 0 && (
                    <div className={styles.itemTags}>
                      {item.tags.map(tag => (
                        <span key={tag} className={styles.tagPill}>{tag}</span>
                      ))}
                    </div>
                  )}
                  
                  {item.steps?.length > 0 && (
                    <div className={styles.stepsList}>
                      <h4>Steps:</h4>
                      <ol>
                        {item.steps.map((step, i) => (
                          <li key={i}>
                            {step.text}
                            {step.link && (
                              <a 
                                href={step.link} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className={styles.stepLink}
                              >
                                (Link)
                              </a>
                            )}
                          </li>
                        ))}
                      </ol>
                    </div>
                  )}

                  {item.info && (
                    <div className={styles.additionalInfo}>
                      <h4>Notes:</h4>
                      <p>{item.info}</p>
                    </div>
                  )}

{item.sources?.length > 0 && (
  <div className={styles.itemSources}>
    {item.sources.map((source, i) => (
      <a 
        key={i} 
        href={source.url} 
        target="_blank" 
        rel="noopener noreferrer"
        className={styles.sourceLink}
      >
        <SourceIcon type={source.type} />
        <span className={styles.sourceText}>{source.type}</span>
      </a>
    ))}
  </div>
)}

<div className={styles.itemMeta}>
  {item.updatedAt && (
    <small>Updated: {new Date(item.updatedAt).toLocaleDateString()}</small>
  )}
  <small>Added: {new Date(item.createdAt).toLocaleDateString()}</small>
</div>
                </div>
              ))}
            </div>
          ) : (
            <div className={styles.emptyState}>
              <p>No airdrops available yet</p>
            </div>
          )}
        </div>
      </div>

      <footer className={styles.footer}>
  <div className={styles.socialIcons}>
    <a href="https://twitter.com" target="_blank" rel="noopener noreferrer">
      <Image
        src="https://raw.githubusercontent.com/abcdrop/airdrop/main/Icon/x_twitter.png"
        alt="Twitter"
        width={28}
        height={28}
        className={styles.socialIcon}
      />
    </a>
    <a href="https://telegram.org" target="_blank" rel="noopener noreferrer">
      <Image
        src="https://raw.githubusercontent.com/abcdrop/airdrop/main/Icon/telegram.png"
        alt="Telegram"
        width={28}
        height={28}
        className={styles.socialIcon}
      />
    </a>
    <a href="https://discord.com" target="_blank" rel="noopener noreferrer">
      <Image
        src="https://raw.githubusercontent.com/abcdrop/airdrop/main/Icon/discord.png"
        alt="Discord"
        width={28}
        height={28}
        className={styles.socialIcon}
      />
    </a>
  </div>
  <p>© {new Date().getFullYear()} All rights reserved</p>
</footer>
    </div>
  );
}