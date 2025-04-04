import { useState, useEffect } from 'react';
import axios from 'axios';
import styles from '../styles/Home.module.css';

export default function Home() {
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [filter, setFilter] = useState('latest');
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

  // Add this useEffect hook for the animation
useEffect(() => {
  let toggle = true;
  const slideDuration = 200; // ms
  const bounceDuration = 300; // ms
  const visibleDuration = 2000; // ms

  const animateBounce = () => {
    setLogoTransform("translateY(-10px)");
    setTimeout(() => setLogoTransform("translateY(0)"), bounceDuration);
  };

  const changeText = () => {
    // Slide down
    setLogoTransform("translateY(70px)");
    setLogoOpacity(0);
    
    setTimeout(() => {
      // Change text
      setLogoText(toggle ? "IR" : "BC");
      toggle = !toggle;
      
      // Reset position above
      setLogoTransform("translateY(-70px)");
      setLogoOpacity(0);
      
      setTimeout(() => {
        // Slide up
        setLogoTransform("translateY(0)");
        setLogoOpacity(1);
        
        setTimeout(animateBounce, slideDuration + 50);
      }, 20);
    }, slideDuration);
  };

  const timer = setTimeout(() => {
    changeText();
    const interval = setInterval(changeText, slideDuration * 2 + bounceDuration + visibleDuration);
    return () => clearInterval(interval);
  }, 1000);

  return () => clearTimeout(timer);
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
    
    // Apply tag filter
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
      case 'latest':
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

  // Initial data load
  useEffect(() => {
    fetchData();
    fetchTags();
  }, []);

  return (
    <div className={styles.container}>
      <header className={styles.header}>
  <div className={styles.logoContainer}>
    <span className={styles.logoStatic}>A</span>
    <div className={styles.logoRollingContainer}>
      <span 
        className={styles.logoAnimated} 
        style={{ 
          transform: logoTransform, 
          opacity: logoOpacity,
          marginLeft: '0px' // Slight adjustment for perfect spacing
        }}
      >
        {logoText}
      </span>
    </div>
    <span className={styles.logoStatic}>DROP LIST</span>
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
              <option value="latest">Latest</option>
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

                  <div className={styles.itemMeta}>
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
    <img 
      src="https://raw.githubusercontent.com/abcdrop/airdrop/main/Icon/x_twitter.png" 
      alt="Twitter" 
      className={styles.socialIcon}
      onError={(e) => {
        e.target.onerror = null; 
        e.target.src = '/Icon/x_twitter.png' // Fallback ke path lokal
      }}
    />
  </a>
  <a href="https://telegram.org" target="_blank" rel="noopener noreferrer">
    <img 
      src="https://raw.githubusercontent.com/abcdrop/airdrop/main/Icon/telegram.png" 
      alt="Telegram" 
      className={styles.socialIcon}
      onError={(e) => {
        e.target.onerror = null; 
        e.target.src = '/Icon/telegram.png'
      }}
    />
  </a>
  <a href="https://discord.com" target="_blank" rel="noopener noreferrer">
    <img 
      src="https://raw.githubusercontent.com/abcdrop/airdrop/main/Icon/discord.png" 
      alt="Discord" 
      className={styles.socialIcon}
      onError={(e) => {
        e.target.onerror = null; 
        e.target.src = '/Icon/discord.png'
      }}
    />
  </a>
</div>
        <p>© 2025 All rights reserved</p>
      </footer>
    </div>
  );
}