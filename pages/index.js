import { useState, useEffect } from 'react';
import axios from 'axios';
import styles from '../styles/Home.module.css';

export default function Home() {
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [filter, setFilter] = useState('latest');

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

  // Sort items based on filter
  const getSortedItems = () => {
    const itemsCopy = [...items];
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
  }, []);

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>ABCDrop List</h1>
      </header>

      <div className={styles.mainContent}>
        {/* Filter Section */}
        <div className={styles.filterSection}>
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

        {/* Display Section */}
        <div className={styles.displaySection}>
          {isLoading ? (
            <div className={styles.loading}>Loading...</div>
          ) : items.length > 0 ? (
            <div className={styles.itemsGrid}>
              {getSortedItems().map((item, index) => (
                <div key={index} className={styles.itemCard}>
                  <h3>{item.title}</h3>
                  
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
            <span className={styles.icon}>𝕏</span>
          </a>
          <a href="https://telegram.org" target="_blank" rel="noopener noreferrer">
            <span className={styles.icon}>✈️</span>
          </a>
          <a href="https://discord.com" target="_blank" rel="noopener noreferrer">
            <span className={styles.icon}>💬</span>
          </a>
        </div>
        <p>© 2025 All rights reserved</p>
      </footer>
    </div>
  );
}