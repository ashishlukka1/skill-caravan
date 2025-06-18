import React, { useContext, useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BsSearch, BsBook, BsGear, BsBoxArrowRight, BsX, BsClock, BsStar } from 'react-icons/bs';
import { PiCertificateLight } from "react-icons/pi";
import { FiChevronDown } from 'react-icons/fi';
import { AuthContext } from '../../context/AuthContext';
import axios from '../../utils/axios';
import './Navbar.css';

const Navbar = () => {
  const { user, setUser } = useContext(AuthContext);
  const [showDropdown, setShowDropdown] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  
  const dropdownRef = useRef(null);
  const buttonRef = useRef(null);
  const searchRef = useRef(null);
  const navigate = useNavigate();

  // Debounce search with longer delay for better UX
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.trim() && searchQuery.length >= 2) {
        performSearch();
      } else {
        setSearchResults([]);
        setShowResults(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowResults(false);
      }
      if (dropdownRef.current && 
          !dropdownRef.current.contains(event.target) && 
          !buttonRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const performSearch = async () => {
    try {
      setIsSearching(true);
      const { data } = await axios.get(`/api/courses/search?q=${encodeURIComponent(searchQuery.trim())}&limit=8`);
      setSearchResults(data);
      setShowResults(true);
    } catch (err) {
      console.error('Search error:', err);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearchSelect = (courseId) => {
    setShowResults(false);
    setSearchQuery('');
    navigate(`/courses/${courseId}`);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setShowResults(false);
      navigate(`/courses?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setUser(null);
    navigate('/login');
  };

  const highlightText = (text, query) => {
    if (!query.trim()) return text;
    const regex = new RegExp(`(${query.trim()})`, 'gi');
    const parts = text.split(regex);
    return parts.map((part, index) => 
      regex.test(part) ? 
        <span key={index} className="highlight">{part}</span> : 
        part
    );
  };

  const formatDuration = (minutes) => {
    if (!minutes) return '';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  return (
    <nav className="navbar">
      <div className="navbar-left">
        <Link to="/" className="navbar-brand">
          <img
            src="https://storage.googleapis.com/skcn-prod-mb-public-tenants/logo/0b250aa2-3030-4772-98e7-a0c5938a771c.png"
            alt="Logo"
          />
        </Link>
     
      <div className="nav-links">
        <Link to="/" className='mx-3'>Home</Link>
        <Link to="/courses">Browse</Link>
        {user?.role === 'admin' && (
          <>
            <Link to="/add-course" className="ms-3">Add Course</Link>
            <Link to="/edit-courses" className="ms-3">Edit Courses</Link>
          </>
        )}
      </div>
      </div>

      <div className="navbar-center me-3" ref={searchRef}>
        <form onSubmit={handleSearchSubmit} className="search-form">
          <div className="search-bar">
            <input
              type="text"
              placeholder="Search for courses, skills, topics..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => searchQuery.trim() && setShowResults(true)}
            />
            {searchQuery && (
              <button 
                type="button"
                className="clear-search" 
                onClick={() => {
                  setSearchQuery('');
                  setShowResults(false);
                }}
              >
                <BsX size={20} />
              </button>
            )}
            <button type="submit" className="search-button">
              <BsSearch size={18} />
            </button>
          </div>
        </form>

        {/* Enhanced Search Results Dropdown */}
        {showResults && (
          <div className="search-results">
            {isSearching ? (
              <div className="search-loading">
                <div className="loading-spinner"></div>
                <span>Searching courses...</span>
              </div>
            ) : searchResults.length > 0 ? (
              <>
                
                <div className="search-results-list">
                  {searchResults.map(course => (
                    <div
                      key={course._id}
                      className="search-result-item"
                      onClick={() => handleSearchSelect(course._id)}
                    >
                      <div className="result-thumbnail">
                        <img 
                          src={course.thumbnail || '/default-course-thumbnail.jpg'} 
                          alt={course.title}
                          onError={(e) => {
                            e.target.src = '/default-course-thumbnail.jpg';
                          }}
                        />
                        {course.isPaid && course.price && (
                          <div className="price-badge">
                            ${course.price}
                          </div>
                        )}
                      </div>
                      <div className="result-info">
                        <h6 className="result-title">
                          {highlightText(course.title, searchQuery)}
                        </h6>
                        {course.instructor && (
                          <div className="result-instructor">
                            by {course.instructor.name || course.instructor}
                          </div>
                        )}
                        <div className="result-meta">
                          {course.rating && (
                            <div className="rating">
                              <BsStar className="star-icon" />
                              <span>{course.rating.toFixed(1)}</span>
                              {course.reviewCount && (
                                <span className="review-count">({course.reviewCount})</span>
                              )}
                            </div>
                          )}
                          {course.duration && (
                            <div className="duration">
                              <BsClock className="clock-icon" />
                              <span>{formatDuration(course.duration)}</span>
                            </div>
                          )}
                          {course.level && (
                            <div className="level">
                              <span className={`level-badge level-${course.level.toLowerCase()}`}>
                                {course.level}
                              </span>
                            </div>
                          )}
                        </div>
                        {course.tags && course.tags.length > 0 && (
                          <div className="result-tags">
                            {course.tags.slice(0, 3).map((tag, idx) => (
                              <span key={idx} className="tag">
                                {highlightText(tag, searchQuery)}
                              </span>
                            ))}
                            {course.tags.length > 3 && (
                              <span className="tag-more">+{course.tags.length - 3}</span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : searchQuery.trim().length >= 2 ? (
              <div className="no-results">
                <div className="no-results-icon">🔍</div>
                <div className="no-results-text">
                  <h6>No courses found</h6>
                  <p>Try searching for different keywords or browse our course catalog</p>
                </div>
                <button 
                  className="browse-btn"
                  onClick={() => {
                    setShowResults(false);
                    navigate('/courses');
                  }}
                >
                  Browse All Courses
                </button>
              </div>
            ) : (
              <div className="search-hint">
                <p>Start typing to search for courses...</p>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="navbar-right">
        {user ? (
          <div className="profile-dropdown">
            <button
              ref={buttonRef}
              className={`profile-button ${showDropdown ? 'active' : ''}`}
              onClick={() => setShowDropdown((prev) => !prev)}
              aria-haspopup="true"
              aria-expanded={showDropdown}
            >
              <span className="profile-name">{user?.name}</span>
              <FiChevronDown
                size={20}
                className={`dropdown-icon ${showDropdown ? 'rotated' : ''}`}
              />
            </button>
            <div
              ref={dropdownRef}
              className={`dropdown-menu ${showDropdown ? 'active' : ''}`}
              style={{ display: showDropdown ? 'block' : 'none' }}
            >
              <div className="dropdown-profile px-3 py-2">
                <div className="fw-bold">{user.name}</div>
                <div className="text-muted" style={{ fontSize: '0.9em' }}>{user.email}</div>
              </div>
              <div className="dropdown-divider" />
              <Link to="/my-courses" className="dropdown-item" onClick={() => setShowDropdown(false)}>
                <BsBook size={16} />
                <span>My Learning</span>
              </Link>
              <div className="dropdown-divider" />
              <Link to="/my-certificates" className="dropdown-item" onClick={() => setShowDropdown(false)}>
                <PiCertificateLight  size={16}/>
                <span>My Certificates</span>
              </Link>
              <div className="dropdown-divider" />
              <Link to="/profile" className="dropdown-item" onClick={() => setShowDropdown(false)}>
                <BsGear size={16} />
                <span>Profile Settings</span>
              </Link>
              <div className="dropdown-divider" />
              <button onClick={handleLogout} className="dropdown-item">
                <BsBoxArrowRight size={16} />
                <span>Logout</span>
              </button>
            </div>
          </div>
        ) : (
          <div>
            <Link to="/login" className="btn btn-outline-primary me-2 buttons text-black">Login</Link>
            <Link to="/register" className="btn btn-primary buttons">Register</Link>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;