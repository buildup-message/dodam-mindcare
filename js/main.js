document.addEventListener('DOMContentLoaded', () => {
  
  /* ==========================================================================
     1. Header Navigation & Active Links on Scroll
     ========================================================================== */
  const header = document.getElementById('header');
  const navMenu = document.getElementById('nav-menu');
  const navToggle = document.getElementById('nav-toggle');
  const navLinks = document.querySelectorAll('.nav-link');
  
  // Header shrinkage on scroll
  window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
    highlightNavLink();
  });
  
  // Toggle mobile menu
  if (navToggle) {
    navToggle.addEventListener('click', () => {
      navMenu.classList.toggle('active');
      navToggle.classList.toggle('active');
    });
  }
  
  // Close mobile menu when a link is clicked
  navLinks.forEach(link => {
    link.addEventListener('click', () => {
      navMenu.classList.remove('active');
      navToggle.classList.remove('active');
    });
  });
  
  // Highlight navigation link corresponding to current section
  const sections = document.querySelectorAll('section[id]');
  function highlightNavLink() {
    let scrollY = window.pageYOffset;
    
    sections.forEach(current => {
      const sectionHeight = current.offsetHeight;
      const sectionTop = current.offsetTop - 100;
      const sectionId = current.getAttribute('id');
      
      if (scrollY > sectionTop && scrollY <= sectionTop + sectionHeight) {
        document.querySelector(`.nav a[href*=${sectionId}]`)?.classList.add('active');
      } else {
        document.querySelector(`.nav a[href*=${sectionId}]`)?.classList.remove('active');
      }
    });
  }

  /* ==========================================================================
     2. Scroll Reveal Animations (Intersection Observer)
     ========================================================================== */
  const reveals = document.querySelectorAll('.reveal');
  const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('active');
        observer.unobserve(entry.target); // Trigger only once
      }
    });
  }, {
    threshold: 0.15,
    rootMargin: '0px 0px -50px 0px'
  });
  
  reveals.forEach(el => revealObserver.observe(el));


  /* ==========================================================================
     3. Psychological Test & Pricing Modals
     ========================================================================== */
  const openTestBtn = document.getElementById('open-test-modal');
  const openPriceBtn = document.getElementById('open-price-modal');
  const modalTest = document.getElementById('modal-test');
  const modalPrice = document.getElementById('modal-price');
  const closeTestBtn = document.getElementById('close-test-modal');
  const closePriceBtn = document.getElementById('close-price-modal');
  
  function openModal(modal) {
    modal.classList.add('active');
    document.body.style.overflow = 'hidden'; // Stop background scroll
  }
  
  function closeModal(modal) {
    modal.classList.remove('active');
    document.body.style.overflow = ''; // Restore scroll
  }
  
  if (openTestBtn) openTestBtn.addEventListener('click', () => openModal(modalTest));
  if (openPriceBtn) openPriceBtn.addEventListener('click', () => openModal(modalPrice));
  if (closeTestBtn) closeTestBtn.addEventListener('click', () => closeModal(modalTest));
  if (closePriceBtn) closePriceBtn.addEventListener('click', () => closeModal(modalPrice));
  
  // Close modals when clicking overlay background
  [modalTest, modalPrice].forEach(modal => {
    if (modal) {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal(modal);
      });
    }
  });


  /* ==========================================================================
     4. Testimonials (Reviews) Carousel Slider
     ========================================================================== */
  const reviewsSlider = document.getElementById('reviews-slider');
  const reviewCards = document.querySelectorAll('.review-card');
  const prevBtn = document.getElementById('review-prev');
  const nextBtn = document.getElementById('review-next');
  const dotsContainer = document.getElementById('review-dots');
  
  let currentReviewIndex = 0;
  const totalReviews = reviewCards.length;
  let autoplayTimer;
  
  if (reviewsSlider && totalReviews > 0) {
    // Generate Pagination Dots
    for (let i = 0; i < totalReviews; i++) {
      const dot = document.createElement('div');
      dot.classList.add('review-dot');
      if (i === 0) dot.classList.add('active');
      dot.addEventListener('click', () => {
        goToReview(i);
        resetAutoplay();
      });
      dotsContainer.appendChild(dot);
    }
    
    const dots = document.querySelectorAll('.review-dot');
    
    function updateSlider() {
      reviewsSlider.style.transform = `translateX(-${currentReviewIndex * 100}%)`;
      dots.forEach((dot, idx) => {
        if (idx === currentReviewIndex) dot.classList.add('active');
        else dot.classList.remove('active');
      });
    }
    
    function nextReview() {
      currentReviewIndex = (currentReviewIndex + 1) % totalReviews;
      updateSlider();
    }
    
    function prevReview() {
      currentReviewIndex = (currentReviewIndex - 1 + totalReviews) % totalReviews;
      updateSlider();
    }
    
    function goToReview(index) {
      currentReviewIndex = index;
      updateSlider();
    }
    
    function startAutoplay() {
      autoplayTimer = setInterval(nextReview, 5000); // Auto shift every 5s
    }
    
    function resetAutoplay() {
      clearInterval(autoplayTimer);
      startAutoplay();
    }
    
    if (nextBtn) nextBtn.addEventListener('click', () => { nextReview(); resetAutoplay(); });
    if (prevBtn) prevBtn.addEventListener('click', () => { prevReview(); resetAutoplay(); });
    
    // Swipe gestures support for Mobile
    let startX = 0;
    let endX = 0;
    reviewsSlider.addEventListener('touchstart', (e) => {
      startX = e.touches[0].clientX;
    }, { passive: true });
    
    reviewsSlider.addEventListener('touchend', (e) => {
      endX = e.changedTouches[0].clientX;
      if (startX - endX > 50) { // Swipe Left
        nextReview();
        resetAutoplay();
      } else if (endX - startX > 50) { // Swipe Right
        prevReview();
        resetAutoplay();
      }
    }, { passive: true });
    
    startAutoplay();
  }


  /* ==========================================================================
     5. Photo Gallery (Dodam Space) & Lightbox
     ========================================================================== */
  const spaceGallery = document.getElementById('space-gallery');
  const filterButtons = document.querySelectorAll('.filter-btn');
  const lightbox = document.getElementById('lightbox');
  const lightboxImg = document.getElementById('lightbox-img');
  const lightboxCaption = document.getElementById('lightbox-caption');
  const lightboxClose = document.getElementById('lightbox-close');
  const lightboxPrev = document.getElementById('lightbox-prev');
  const lightboxNext = document.getElementById('lightbox-next');
  
  // Photo Data Map (All 43 Photos supplied by the user)
  // Mapping categories: lobby (대기실/서가), room (상담/치료실), sand (모래놀이), seminar (세미나실)
  //
  // NOTE: the real KakaoTalk export filenames do NOT share one timestamp per block —
  // each burst of a few photos has its own timestamp. These two maps record the actual
  // timestamp suffix for every existing file (verified against the restored 사진/ folder);
  // block 1 has no "019" (KakaoTalk never exported that number), so it is skipped below.
  const block1Timestamps = {
    1: '47', 2: '47', 3: '47', 4: '47', 5: '47',
    6: '48', 7: '48', 8: '48', 9: '48',
    10: '49', 11: '49', 12: '49', 13: '49', 14: '49', 15: '49',
    16: '50', 17: '50', 18: '50',
    20: '51', 21: '51', 22: '51', 23: '51',
    24: '52', 25: '52'
  };
  const block2Timestamps = {
    1: '06', 2: '06', 3: '06',
    4: '07', 5: '07', 6: '07',
    7: '08', 8: '08', 9: '08', 10: '08', 11: '08',
    12: '09', 13: '09', 14: '09', 15: '09', 16: '09',
    17: '10', 18: '10', 19: '10'
  };

  const photos = [];

  // Fill first block (001 ~ 025, no 019)
  for (let i = 1; i <= 25; i++) {
    if (i === 19) continue; // this file does not exist in the export
    const num = String(i).padStart(3, '0');
    let cat = 'room'; // default
    let caption = `상담실 내부 공간`;

    if (i === 1 || i === 2 || i === 8 || i === 12 || i === 14) {
      cat = 'lobby';
      caption = '대기실 전경 및 라왕나무 데스크';
    } else if (i === 3 || i === 7 || i === 15 || i === 20) {
      cat = 'lobby';
      caption = '책방 분위기의 서가 공간';
    } else if (i === 4 || i === 9 || i === 13 || i === 18) {
      cat = 'sand';
      caption = '따뜻하고 안전한 모래놀이치료실';
    } else if (i === 5 || i === 10 || i === 22 || i === 25) {
      cat = 'seminar';
      caption = '소모임 및 집단 상담 세미나실';
    } else if (i === 6 || i === 11 || i === 16 || i === 21) {
      cat = 'room';
      caption = '아늑한 성인/부부 상담 공간';
    } else {
      cat = 'room';
      caption = '아늑한 개인 상담 치료실';
    }

    photos.push({
      src: `./사진/KakaoTalk_Photo_2026-06-11-00-15-${block1Timestamps[i]} ${num}.jpeg`,
      cat: cat,
      title: caption
    });
  }

  // Fill second block (001 ~ 019)
  for (let i = 1; i <= 19; i++) {
    const num = String(i).padStart(3, '0');
    let cat = 'room';
    let caption = `아늑한 상담 공간`;

    if (i === 1 || i === 5 || i === 9 || i === 14) {
      cat = 'lobby';
      caption = '대기실 및 따뜻한 인테리어 디테일';
    } else if (i === 2 || i === 6 || i === 10 || i === 15) {
      cat = 'lobby';
      caption = '편안하게 머물 수 있는 책장 서가';
    } else if (i === 3 || i === 7 || i === 11 || i === 16) {
      cat = 'sand';
      caption = '모래놀이치료실 피규어 장식';
    } else if (i === 4 || i === 8 || i === 12 || i === 17) {
      cat = 'seminar';
      caption = '소규모 세미나 강의실 일부';
    } else {
      cat = 'room';
      caption = '아늑하고 정온한 상담치료실';
    }

    photos.push({
      src: `./사진/KakaoTalk_Photo_2026-06-11-00-16-${block2Timestamps[i]} ${num}.jpeg`,
      cat: cat,
      title: caption
    });
  }

  // Filtered array keeping track of active items in view
  let activePhotos = [...photos];
  let currentLightboxIndex = 0;
  
  // Render Gallery Items
  function renderGallery(filter = 'all') {
    spaceGallery.innerHTML = '';
    
    // If filter is all, we display first 16 photos by default (to avoid overcluttering), 
    // and provide a subtle "load more" if needed, but let's show all matching or a rich sample of 24
    let filtered = photos;
    if (filter !== 'all') {
      filtered = photos.filter(p => p.cat === filter);
    } else {
      // Show first 18 premium photos to keep load light, or all 43. 
      // Let's show all 43 in dynamic grid with lazy loading.
      filtered = photos;
    }
    
    activePhotos = filtered;
    
    filtered.forEach((photo, index) => {
      const item = document.createElement('div');
      item.classList.add('gallery-item');
      item.setAttribute('data-category', photo.cat);
      
      // Category Text
      let catText = '상담실';
      if (photo.cat === 'lobby') catText = '대기실/서가';
      if (photo.cat === 'sand') catText = '모래놀이치료실';
      if (photo.cat === 'seminar') catText = '세미나실';
      
      item.innerHTML = `
        <img src="${photo.src}" alt="${photo.title}" loading="lazy">
        <div class="gallery-item-hover-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/></svg>
        </div>
        <div class="gallery-item-info">
          <span class="gallery-item-cat">${catText}</span>
          <h4 class="gallery-item-title">${photo.title}</h4>
        </div>
      `;
      
      item.addEventListener('click', () => {
        openLightbox(index);
      });
      
      spaceGallery.appendChild(item);
    });
  }
  
  // Lightbox Operations
  function openLightbox(index) {
    currentLightboxIndex = index;
    const photo = activePhotos[index];
    if (photo) {
      lightboxImg.src = photo.src;
      lightboxCaption.textContent = photo.title;
      lightbox.classList.add('active');
      document.body.style.overflow = 'hidden';
    }
  }
  
  function closeLightbox() {
    lightbox.classList.remove('active');
    document.body.style.overflow = '';
  }
  
  function prevLightbox() {
    currentLightboxIndex = (currentLightboxIndex - 1 + activePhotos.length) % activePhotos.length;
    const photo = activePhotos[currentLightboxIndex];
    if (photo) {
      lightboxImg.src = photo.src;
      lightboxCaption.textContent = photo.title;
    }
  }
  
  function nextLightbox() {
    currentLightboxIndex = (currentLightboxIndex + 1) % activePhotos.length;
    const photo = activePhotos[currentLightboxIndex];
    if (photo) {
      lightboxImg.src = photo.src;
      lightboxCaption.textContent = photo.title;
    }
  }
  
  // Event Listeners for Lightbox
  if (lightboxClose) lightboxClose.addEventListener('click', closeLightbox);
  if (lightboxPrev) lightboxPrev.addEventListener('click', prevLightbox);
  if (lightboxNext) lightboxNext.addEventListener('click', nextLightbox);
  
  // Close Lightbox on backdrop click
  if (lightbox) {
    lightbox.addEventListener('click', (e) => {
      if (e.target === lightbox) closeLightbox();
    });
  }
  
  // Keypress support (Esc, Left, Right arrows)
  document.addEventListener('keydown', (e) => {
    if (!lightbox.classList.contains('active')) return;
    if (e.key === 'Escape') closeLightbox();
    if (e.key === 'ArrowLeft') prevLightbox();
    if (e.key === 'ArrowRight') nextLightbox();
  });
  
  // Filter Button Events
  filterButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      filterButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const filterValue = btn.getAttribute('data-filter');
      renderGallery(filterValue);
    });
  });
  
  // Initial gallery render
  renderGallery('all');
});
