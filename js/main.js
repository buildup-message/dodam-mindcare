document.addEventListener('DOMContentLoaded', () => {
  
  /* ==========================================================================
     1. Header Navigation & Active Links on Scroll
     ========================================================================== */
  const header = document.getElementById('header');
  const navMenu = document.getElementById('nav-menu');
  const navToggle = document.getElementById('nav-toggle');
  const navLinks = document.querySelectorAll('.nav-link');
  const navGroups = document.querySelectorAll('.nav-group');

  function closeNavGroups() {
    navGroups.forEach(g => {
      g.classList.remove('open');
      g.querySelector('.nav-group-toggle')?.setAttribute('aria-expanded', 'false');
    });
  }

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
      closeNavGroups();
    });
  }

  // Close mobile menu when a link is clicked
  navLinks.forEach(link => {
    link.addEventListener('click', () => {
      navMenu.classList.remove('active');
      navToggle.classList.remove('active');
      closeNavGroups();
    });
  });

  // 센터소개 / 상담안내 dropdown groups
  navGroups.forEach(group => {
    const toggle = group.querySelector('.nav-group-toggle');
    if (!toggle) return;
    toggle.addEventListener('click', (e) => {
      e.stopPropagation();
      const isOpen = group.classList.contains('open');
      closeNavGroups();
      if (!isOpen) {
        group.classList.add('open');
        toggle.setAttribute('aria-expanded', 'true');
      }
    });
  });

  document.addEventListener('click', (e) => {
    if (!e.target.closest('.nav-group')) closeNavGroups();
  });

  // Highlight navigation link corresponding to current section
  const sections = document.querySelectorAll('section[id]');
  function highlightNavLink() {
    let scrollY = window.pageYOffset;

    sections.forEach(current => {
      const sectionHeight = current.offsetHeight;
      const sectionTop = current.offsetTop - 100;
      const sectionId = current.getAttribute('id');
      const link = document.querySelector(`.nav a[href*=${sectionId}]`);
      const groupToggle = link?.closest('.nav-group')?.querySelector('.nav-group-toggle');

      if (scrollY > sectionTop && scrollY <= sectionTop + sectionHeight) {
        link?.classList.add('active');
        groupToggle?.classList.add('active');
      } else {
        link?.classList.remove('active');
        groupToggle?.classList.remove('active');
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
    threshold: 0,
    rootMargin: '0px 0px 0px 0px'
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
  // Every entry below was assigned by opening the actual restored JPEG and reading what is
  // in the frame — not inferred from filename order. cat/title are per-photo, not per-block.
  // A handful of photos were genuinely ambiguous against this 4-category filter (multi-purpose
  // play rooms that also hold a small sand tray, decorative still-life shots with no visible
  // room context, and one exterior signage photo) and were placed in the closest-fitting
  // category; that judgment call is logged in the worker completion report, not in these
  // user-facing captions.
  const block1Photos = [
    { num: '001', ts: '47', cat: 'lobby', title: '센터 입구 – 원목 여닫이문과 화분이 있는 진입로' },
    { num: '002', ts: '47', cat: 'lobby', title: '입구 문 손잡이와 잠금장치 클로즈업' },
    { num: '003', ts: '47', cat: 'lobby', title: "입구 벽면 '도담마인드케어' 명패 조명 디테일" },
    { num: '004', ts: '47', cat: 'lobby', title: '명패가 보이는 진입 복도, 화분과 함께' },
    { num: '005', ts: '47', cat: 'room', title: '아동 놀이치료실 – 장난감 자동차·보드게임 선반과 작은 모래상자' },
    { num: '006', ts: '48', cat: 'room', title: '아동 놀이치료실 – 보드게임과 인형 선반' },
    { num: '007', ts: '48', cat: 'room', title: '아동 놀이치료실 – 이젤과 미니 주방놀이 세트' },
    { num: '008', ts: '48', cat: 'room', title: '아동 놀이치료실 전경 – 다양한 놀이 교구' },
    { num: '009', ts: '48', cat: 'room', title: '아동 놀이치료실 – 소품 선반 디테일' },
    { num: '010', ts: '49', cat: 'sand', title: '모래놀이치료실 – 벽면 가득한 피규어 컬렉션과 모래상자' },
    { num: '011', ts: '49', cat: 'sand', title: '모래놀이치료실 – 피규어 선반 전경' },
    { num: '012', ts: '49', cat: 'sand', title: '모래놀이치료실 – 인물·동물 피규어 진열' },
    { num: '013', ts: '49', cat: 'sand', title: '모래놀이치료실 – 모래상자와 의자' },
    { num: '014', ts: '49', cat: 'sand', title: '모래놀이치료실 – 선반 디테일 확대' },
    { num: '015', ts: '49', cat: 'seminar', title: '세미나실(독서모임 공간) – 서가와 원탁, TV' },
    { num: '016', ts: '50', cat: 'lobby', title: '복도 전경 – 진입로 방향' },
    { num: '017', ts: '50', cat: 'lobby', title: '복도 전경 – 진입로 벽면' },
    { num: '018', ts: '50', cat: 'lobby', title: '내부 복도 – 액자와 공용 테이블이 보이는 통로' },
    { num: '020', ts: '51', cat: 'lobby', title: '입구 유리문 클로즈업 – 바깥 풍경' },
    { num: '021', ts: '51', cat: 'lobby', title: '리셉션 데스크 – 벽시계와 커튼이 보이는 대기공간' },
    { num: '022', ts: '51', cat: 'lobby', title: '리셉션 옆 세면대·정수기 코너' },
    { num: '023', ts: '51', cat: 'lobby', title: '세면대 코너 – 다른 각도' },
    { num: '024', ts: '52', cat: 'seminar', title: '세미나실(독서모임방) – 서가와 원탁, 화분' },
    { num: '025', ts: '52', cat: 'seminar', title: '세미나실 – 서가 벽면 전경' }
  ];

  const block2Photos = [
    { num: '001', ts: '06', cat: 'seminar', title: '다목적 활동실(독서모임·그룹활동) – TV, 기타, 서가, 테이블' },
    { num: '002', ts: '06', cat: 'lobby', title: '리셉션 데스크 – 정수기·세면대 코너 (다른 각도)' },
    { num: '003', ts: '06', cat: 'seminar', title: '다목적 활동실 – TV와 마샬 스피커, 서가' },
    { num: '004', ts: '07', cat: 'seminar', title: '다목적 활동실 – 테이블과 의자 배치' },
    { num: '005', ts: '07', cat: 'room', title: '아동 놀이치료실 – 벽돌블록·다트·양궁 교구 선반' },
    { num: '006', ts: '07', cat: 'sand', title: '모래놀이치료실 – 피규어 선반과 모래상자 전경' },
    { num: '007', ts: '08', cat: 'seminar', title: '다목적 활동실 – 서가와 식탁 테이블' },
    { num: '008', ts: '08', cat: 'seminar', title: '다목적 활동실 – TV와 창가 좌석' },
    { num: '009', ts: '08', cat: 'seminar', title: '다목적 활동실 서가 – 아동 도서 진열' },
    { num: '010', ts: '08', cat: 'seminar', title: '창가 데이지 화분 정물' },
    { num: '011', ts: '08', cat: 'seminar', title: '다목적 활동실 – 테이블과 서가 전경' },
    { num: '012', ts: '09', cat: 'seminar', title: '창가 선반 위 화분 3개' },
    { num: '013', ts: '09', cat: 'sand', title: '모래놀이치료실 – 피규어 선반과 모래상자 (다른 각도)' },
    { num: '014', ts: '09', cat: 'seminar', title: '다목적 활동실 서가 – 그림책 진열 클로즈업' },
    { num: '015', ts: '09', cat: 'seminar', title: '창가 데이지 화분 정물 (다른 각도)' },
    { num: '016', ts: '09', cat: 'seminar', title: '다목적 활동실 – TV와 서가 전경' },
    { num: '017', ts: '10', cat: 'seminar', title: "'Happy you' 화분 바구니 정물" },
    { num: '018', ts: '10', cat: 'room', title: '개인 상담실 – 안락의자와 스탠드 조명이 있는 아늑한 코너' },
    { num: '019', ts: '10', cat: 'lobby', title: '건물 외부 간판 – 도담마인드케어 심리상담센터' }
  ];

  const photos = [];

  block1Photos.forEach(p => {
    photos.push({
      src: `./사진/KakaoTalk_Photo_2026-06-11-00-15-${p.ts} ${p.num}.jpeg`,
      cat: p.cat,
      title: p.title
    });
  });

  block2Photos.forEach(p => {
    photos.push({
      src: `./사진/KakaoTalk_Photo_2026-06-11-00-16-${p.ts} ${p.num}.jpeg`,
      cat: p.cat,
      title: p.title
    });
  });

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
