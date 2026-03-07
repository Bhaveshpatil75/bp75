// Cinematic Noir Portfolio

document.addEventListener('DOMContentLoaded', () => {
    console.log('Cinematic Noir Portfolio loaded.');

    runCinematicLoader();

    // --- Cinematic Loading Screen ---
    function runCinematicLoader() {
        const loaderOverlay = document.getElementById('signal-loader');

        if (!loaderOverlay) {
            return;
        }

        // Run the pulse animation for an appropriate minimal amount of time (~1.2s)
        setTimeout(() => {
            loaderOverlay.classList.add('is-hidden');

            // Remove from DOM entirely after fade transition finishes
            setTimeout(() => {
                loaderOverlay.remove();
            }, 800);
        }, 1200);
    }

    // --- Data Loader: Populate content from JSON ---
    async function loadPortfolioData() {
        try {
            const response = await fetch('data/data.json');
            if (!response.ok) throw new Error('Failed to load data');
            const data = await response.json();

            // Expose globally for the terminal
            window._portfolioData = data;

            // Hero content
            const heroName = document.getElementById('hero-name');
            const heroTitle = document.getElementById('hero-title');
            const heroTagline = document.getElementById('hero-tagline');

            if (data.personal) {
                if (heroName && data.personal.name) heroName.textContent = data.personal.name;
                if (heroTitle && data.personal.title) heroTitle.textContent = data.personal.title;
                if (heroTagline && data.personal.tagline) heroTagline.textContent = data.personal.tagline;
            }

            // Resume button
            if (data.resume && data.resume.file) {
                const viewBtn = document.getElementById('btn-view-resume');
                if (viewBtn) viewBtn.href = data.resume.file;
            }

            // --- Interactive Skills Bubbles ---
            if (data.skills) {
                const allSkills = Object.values(data.skills).flat();
                const preview = allSkills.slice(0, 8);
                const area = document.getElementById('skills-bubble-area');

                if (area && preview.length > 0) {
                    const areaRect = area.getBoundingClientRect();
                    const aW = area.offsetWidth;
                    const aH = area.offsetHeight;
                    const bubbles = [];

                    // Create bubble elements and physics state
                    preview.forEach((skill, i) => {
                        const size = Math.max(60, skill.length * 7 + 20);
                        const el = document.createElement('div');
                        el.className = 'skill-bubble';
                        el.textContent = skill;
                        el.style.width = size + 'px';
                        el.style.height = size + 'px';
                        area.appendChild(el);

                        const r = size / 2;
                        // Spread bubbles semi-randomly within the container
                        const cx = r + Math.random() * (aW - size);
                        const cy = r + Math.random() * (aH - size);

                        bubbles.push({
                            el, r, x: cx, y: cy,
                            vx: (Math.random() - 0.5) * 0.3,
                            vy: (Math.random() - 0.5) * 0.3,
                            dragging: false
                        });
                    });

                    // Physics loop
                    function simulateBubbles() {
                        const w = area.offsetWidth;
                        const h = area.offsetHeight;
                        const centerX = w / 2;
                        const centerY = h / 2;

                        bubbles.forEach(b => {
                            if (b.dragging) return;

                            // Gentle drift toward center
                            b.vx += (centerX - b.x) * 0.0003;
                            b.vy += (centerY - b.y) * 0.0003;

                            // Damping
                            b.vx *= 0.98;
                            b.vy *= 0.98;

                            b.x += b.vx;
                            b.y += b.vy;

                            // Boundary collision
                            if (b.x - b.r < 0) { b.x = b.r; b.vx *= -0.5; }
                            if (b.x + b.r > w) { b.x = w - b.r; b.vx *= -0.5; }
                            if (b.y - b.r < 0) { b.y = b.r; b.vy *= -0.5; }
                            if (b.y + b.r > h) { b.y = h - b.r; b.vy *= -0.5; }
                        });

                        // Bubble–bubble collision
                        for (let i = 0; i < bubbles.length; i++) {
                            for (let j = i + 1; j < bubbles.length; j++) {
                                const a = bubbles[i], b = bubbles[j];
                                const dx = b.x - a.x;
                                const dy = b.y - a.y;
                                const dist = Math.sqrt(dx * dx + dy * dy);
                                const minDist = a.r + b.r;

                                if (dist < minDist && dist > 0) {
                                    const overlap = (minDist - dist) / 2;
                                    const nx = dx / dist;
                                    const ny = dy / dist;

                                    if (!a.dragging) { a.x -= nx * overlap; a.y -= ny * overlap; }
                                    if (!b.dragging) { b.x += nx * overlap; b.y += ny * overlap; }

                                    // Exchange velocity component along collision normal
                                    const dvx = a.vx - b.vx;
                                    const dvy = a.vy - b.vy;
                                    const dot = dvx * nx + dvy * ny;
                                    if (dot > 0) {
                                        if (!a.dragging) { a.vx -= dot * nx * 0.4; a.vy -= dot * ny * 0.4; }
                                        if (!b.dragging) { b.vx += dot * nx * 0.4; b.vy += dot * ny * 0.4; }
                                    }
                                }
                            }
                        }

                        // Render
                        bubbles.forEach(b => {
                            b.el.style.left = (b.x - b.r) + 'px';
                            b.el.style.top = (b.y - b.r) + 'px';
                        });

                        requestAnimationFrame(simulateBubbles);
                    }

                    simulateBubbles();

                    // --- Drag interaction ---
                    bubbles.forEach(b => {
                        let lastX, lastY;

                        b.el.addEventListener('pointerdown', (e) => {
                            e.preventDefault();
                            b.dragging = true;
                            b.vx = 0; b.vy = 0;
                            b.el.classList.add('is-dragging');
                            b.el.setPointerCapture(e.pointerId);
                            const rect = area.getBoundingClientRect();
                            lastX = e.clientX - rect.left;
                            lastY = e.clientY - rect.top;
                        });

                        b.el.addEventListener('pointermove', (e) => {
                            if (!b.dragging) return;
                            const rect = area.getBoundingClientRect();
                            const mx = e.clientX - rect.left;
                            const my = e.clientY - rect.top;
                            b.vx = (mx - lastX) * 0.3;
                            b.vy = (my - lastY) * 0.3;
                            b.x = mx;
                            b.y = my;
                            lastX = mx;
                            lastY = my;
                        });

                        b.el.addEventListener('pointerup', () => {
                            b.dragging = false;
                            b.el.classList.remove('is-dragging');
                        });
                    });
                }
            }

            // --- Projects Preview ---
            if (data.projects && data.projects.length > 0) {
                // Store projects globally for modal access
                window._portfolioProjects = data.projects;

                const grid = document.getElementById('projects-preview-grid');
                if (grid) {
                    const previewProjects = data.projects.slice(0, 3);
                    grid.innerHTML = previewProjects.map((project, i) => {
                        const desc = project.description.length > 120
                            ? project.description.substring(0, 120) + '…'
                            : project.description;
                        const chips = (project.tech || [])
                            .map(t => `<span class="project-tech-chip">${t}</span>`)
                            .join('');

                        return `
                            <div class="glass-capsule" data-project-index="${i}">
                                <div class="capsule-closed">
                                    <h3>${project.name}</h3>
                                </div>
                                <div class="capsule-open">
                                    <div class="capsule-content-fade">
                                        <h3>${project.name}</h3>
                                        <p>${desc}</p>
                                        <div class="project-tech-chips">${chips}</div>
                                        <span class="ui-btn secondary ui-btn-sm project-explore-btn">Explore →</span>
                                    </div>
                                </div>
                            </div>
                        `;
                    }).join('');

                    // Add slight magnetic hover to capsules as requested by the overall cinematic vibe
                    if (typeof gsap !== 'undefined') {
                        grid.querySelectorAll('.glass-capsule').forEach(el => {
                            el.style.willChange = 'transform';
                            el.addEventListener('mousemove', (e) => {
                                const rect = el.getBoundingClientRect();
                                const relX = (e.clientX - rect.left) / rect.width - 0.5;
                                const relY = (e.clientY - rect.top) / rect.height - 0.5;
                                gsap.to(el, { x: relX * 10, y: relY * 10, duration: 0.4, ease: 'power2.out', overwrite: 'auto' });
                            });
                            el.addEventListener('mouseleave', () => {
                                gsap.to(el, { x: 0, y: 0, duration: 0.7, ease: 'power2.out', overwrite: 'auto' });
                            });
                        });
                    }
                }
            }

            // --- Experience Pathway ---
            if (data.experience && data.experience.length > 0) {
                window._portfolioExperience = data.experience;

                const timeline = document.getElementById('experience-timeline');
                if (timeline) {
                    // Inject pathway HTML
                    timeline.innerHTML = `
                        <div class="career-pathway">
                            <div class="pathway-line"></div>
                            ${data.experience.map((exp, i) => `
                                <div class="pathway-node timeline-entry" data-exp-index="${i}">
                                    <div class="node-header">
                                        <h3 class="node-role">${exp.role}</h3>
                                        <span class="node-company">${exp.company}</span>
                                        <span class="node-duration">${exp.duration}</span>
                                    </div>
                                    <div class="node-expanded">
                                        <p class="node-desc">${exp.description.length > 100 ? exp.description.substring(0, 100) + '...' : exp.description}</p>
                                        <span class="ui-btn secondary ui-btn-sm timeline-explore">Explore →</span>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    `;

                    // Cinematic GSAP scroll animations for the Pathway track
                    if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
                        const pathwayLine = timeline.querySelector('.pathway-line');
                        const nodes = timeline.querySelectorAll('.pathway-node');

                        const tl = gsap.timeline({
                            scrollTrigger: {
                                trigger: timeline,
                                start: 'top 85%',
                            }
                        });

                        // Draw track length
                        tl.fromTo(pathwayLine,
                            { '--pathway-progress': '0%' },
                            { '--pathway-progress': '100%', duration: 1.2, ease: 'power2.inOut' }
                        )
                            // Stagger fade-in career nodes
                            .from(nodes, {
                                opacity: 0,
                                y: 20,
                                duration: 0.6,
                                stagger: 0.2,
                                ease: 'power2.out'
                            }, "-=0.4");
                    }
                }
            }

            // --- Certifications Digital Vault ---
            if (data.certifications && data.certifications.length > 0) {
                const vaultContainer = document.getElementById('certifications-vault');
                if (vaultContainer) {
                    vaultContainer.innerHTML = data.certifications.map((cert, i) => `
                        <div class="vault-drawer" data-cert-index="${i}">
                            <div class="vault-header">
                                <h3 class="vault-title">${cert.title || cert.name}</h3>
                                <div class="vault-indicator">
                                    <svg viewBox="0 0 24 24"><path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z"/></svg>
                                </div>
                            </div>
                            <div class="vault-content">
                                <div class="vault-content-inner">
                                    <div class="vault-details">
                                        <span class="vault-issuer">${cert.issuer || 'Issuing Organization'}</span>
                                        <span class="vault-date">${cert.issued || cert.date || 'Year'}</span>
                                    </div>
                                    <div class="vault-action">
                                        ${cert.link ? `<button data-cert-link="${cert.link}" class="ui-btn secondary ui-btn-sm btn-view-cert">View Certificate</button>` : `<span style="color:var(--text-secondary); font-size:0.8rem;">No file provided</span>`}
                                    </div>
                                </div>
                            </div>
                        </div>
                    `).join('');

                    // Accordion Logic
                    const headers = vaultContainer.querySelectorAll('.vault-header');
                    headers.forEach(header => {
                        header.addEventListener('click', () => {
                            const drawer = header.parentElement;
                            const isOpen = drawer.classList.contains('is-open');

                            // Close all currently open drawers
                            vaultContainer.querySelectorAll('.vault-drawer.is-open').forEach(openDrawer => {
                                openDrawer.classList.remove('is-open');
                            });

                            // If it wasn't open, open it
                            if (!isOpen) {
                                drawer.classList.add('is-open');
                            }
                        });
                    });

                    // Certificate Modal Logic
                    const certModalOverlay = document.getElementById('cert-modal-overlay');
                    const certModalClose = document.getElementById('cert-modal-close');
                    const certIframe = document.getElementById('cert-iframe');
                    const certModalTitle = document.getElementById('cert-modal-title');

                    const openCertModal = (link, title) => {
                        certIframe.src = link;
                        certModalTitle.textContent = title;
                        certModalOverlay.classList.add('is-open');
                        document.body.style.overflow = 'hidden';
                    };

                    const closeCertModal = () => {
                        certModalOverlay.classList.remove('is-open');
                        setTimeout(() => { certIframe.src = ''; }, 300); // Clear after fade out
                        document.body.style.overflow = '';
                    };

                    certModalClose?.addEventListener('click', closeCertModal);
                    certModalOverlay?.addEventListener('click', (e) => {
                        if (e.target === certModalOverlay) closeCertModal();
                    });

                    // Attach to view buttons
                    vaultContainer.querySelectorAll('.btn-view-cert').forEach(btn => {
                        btn.addEventListener('click', (e) => {
                            e.stopPropagation(); // don't trigger accordion if clicking somehow
                            const link = btn.getAttribute('data-cert-link');
                            // Find the title from the DOM
                            const titleEl = btn.closest('.vault-drawer').querySelector('.vault-title');
                            const title = titleEl ? titleEl.textContent : 'Certificate Preview';
                            openCertModal(link, title);
                        });
                    });
                }
            }

            // --- Achievements Showcase ---
            if (data.achievements && data.achievements.length > 0) {
                const metalRack = document.getElementById('metal-rack');

                if (metalRack) {
                    // Expose achievements for modal access
                    window._portfolioAchievements = data.achievements;

                    const trophySvg = `<svg class="trophy-icon" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M19 5h-2V3H7v2H5c-1.1 0-2 .9-2 2v1c0 2.55 1.92 4.63 4.39 4.94A5.01 5.01 0 0 0 11 15.9V19H7v2h10v-2h-4v-3.1a5.01 5.01 0 0 0 3.61-2.96C19.08 12.63 21 10.55 21 8V7c0-1.1-.9-2-2-2zM5 8V7h2v3.82C5.84 10.4 5 9.3 5 8zm14 0c0 1.3-.84 2.4-2 2.82V7h2v1z"/></svg>`;

                    // Fixed configuration: 3 tops, 2 bottom
                    const topTrophies = data.achievements.slice(0, 3);
                    const bottomTrophies = data.achievements.slice(3, 5);

                    const generateTrophies = (items, startIndex) => items.map((ach, i) => `
                        <div class="trophy-item" data-ach-index="${startIndex + i}">
                            <div class="trophy-icon-wrapper">
                                ${trophySvg}
                            </div>
                        </div>
                    `).join('');

                    metalRack.innerHTML = `
                        <div class="cabinet-back-wall"></div>
                        <div class="cabinet-ceiling"></div>
                        <div class="cabinet-floor"></div>
                        <div class="cabinet-left-wall"></div>
                        <div class="cabinet-right-wall"></div>
                        
                        <div class="metal-shelf-3d top-shelf">
                            <div class="shelf-face top"></div>
                            <div class="shelf-face bottom"></div>
                            <div class="shelf-face front"></div>
                            <div class="metal-shelf-content">
                                ${generateTrophies(topTrophies, 0)}
                            </div>
                        </div>
                        <div class="metal-shelf-3d bottom-shelf">
                            <div class="shelf-face top"></div>
                            <div class="shelf-face bottom"></div>
                            <div class="shelf-face front"></div>
                            <div class="metal-shelf-content">
                                ${generateTrophies(bottomTrophies, 3)}
                            </div>
                        </div>
                            `;

                    // Optional subtle intro animation if gsap is loaded
                    if (typeof gsap !== 'undefined') {
                        gsap.from('.trophy-item', {
                            scrollTrigger: {
                                trigger: '.achievements-section',
                                start: 'top 80%',
                            },
                            y: 30,
                            opacity: 0,
                            duration: 0.8,
                            stagger: 0.1,
                            ease: 'power3.out'
                        });
                    }
                }
            }
        } catch (err) {
            console.warn('Portfolio data could not be loaded. Using fallback HTML content.', err);
        }
    }

    loadPortfolioData();

    // --- Project Detail Modal System ---
    const modalOverlay = document.getElementById('modal-overlay');
    const modalPanel = document.getElementById('modal-panel');
    const modalClose = document.getElementById('modal-close');
    const modalTitle = document.getElementById('modal-title');
    const modalDesc = document.getElementById('modal-desc');
    const modalTech = document.getElementById('modal-tech');
    const modalActions = document.getElementById('modal-actions');

    function openModal(index) {
        const projects = window._portfolioProjects;
        if (!projects || !projects[index]) return;
        const project = projects[index];

        modalTitle.textContent = project.name;
        modalDesc.textContent = project.description;

        // Tech chips
        modalTech.innerHTML = (project.tech || [])
            .map(t => `<span class="project-tech-chip">${t}</span>`)
            .join('');

        // Action buttons — only show if link exists
        let buttonsHtml = '';
        if (project.demo) buttonsHtml += `<a href="${project.demo}" class="ui-btn secondary modal-btn" target="_blank">Live Demo</a>`;
        if (project.github) buttonsHtml += `<a href="${project.github}" class="ui-btn secondary modal-btn" target="_blank">GitHub Repository</a>`;
        modalActions.innerHTML = buttonsHtml;

        modalOverlay.classList.add('is-open');
        document.body.style.overflow = 'hidden';
    }

    function closeModal() {
        modalOverlay.classList.remove('is-open');
        document.body.style.overflow = '';
    }

    // Close button
    if (modalClose) modalClose.addEventListener('click', closeModal);

    // Click outside panel
    if (modalOverlay) {
        modalOverlay.addEventListener('click', (e) => {
            if (e.target === modalOverlay) closeModal();
        });
    }

    // ESC key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modalOverlay.classList.contains('is-open')) {
            closeModal();
        }
    });

    // Delegate card clicks — whole card opens modal
    document.addEventListener('click', (e) => {
        // Project cards (now glass capsules)
        const projectCard = e.target.closest('.glass-capsule[data-project-index]');
        if (projectCard) {
            e.preventDefault();
            const index = parseInt(projectCard.dataset.projectIndex, 10);
            if (!isNaN(index)) openModal(index);
            return;
        }

        // Experience timeline cards
        const expEntry = e.target.closest('.timeline-entry[data-exp-index]');
        if (expEntry) {
            e.preventDefault();
            const index = parseInt(expEntry.dataset.expIndex, 10);
            const exps = window._portfolioExperience;
            if (!isNaN(index) && exps && exps[index]) {
                const exp = exps[index];
                modalTitle.textContent = exp.role;
                modalDesc.textContent = exp.description;

                // Show company + duration as tech-style chips
                modalTech.innerHTML = `<span class="project-tech-chip">${exp.company}</span>
                                       <span class="project-tech-chip">${exp.duration}</span>`;

                // Certificate & company link buttons
                let btns = '';
                if (exp.links && exp.links.certificate) btns += `<a href="${exp.links.certificate}" class="ui-btn secondary modal-btn" target="_blank">Certificate</a>`;
                if (exp.links && exp.links.company) btns += `<a href="${exp.links.company}" class="ui-btn secondary modal-btn" target="_blank">Company</a>`;
                modalActions.innerHTML = btns;

                modalOverlay.classList.add('is-open');
                document.body.style.overflow = 'hidden';
            }
            return;
        }

        // Achievement Trophy Items
        const trophyItem = e.target.closest('.trophy-item[data-ach-index]');
        if (trophyItem) {
            e.preventDefault();
            const index = parseInt(trophyItem.dataset.achIndex, 10);
            const achs = window._portfolioAchievements;
            if (!isNaN(index) && achs && achs[index]) {
                const ach = achs[index];
                modalTitle.textContent = ach.title;
                modalDesc.textContent = ach.organization;

                modalTech.innerHTML = ach.date ? `<span class="project-tech-chip">${ach.date}</span>` : '';

                let btns = '';
                if (ach.link) btns += `<a href="${ach.link}" class="ui-btn secondary modal-btn" target="_blank">View Certificate</a>`;
                modalActions.innerHTML = btns;

                modalOverlay.classList.add('is-open');
                document.body.style.overflow = 'hidden';
            }
        }
    });

    // Select Hero elements
    const heroTitle = document.querySelector('.hero-title');
    const heroTagline = document.querySelector('.hero-tagline');

    // Make elements invisible initially to prevent FOUC (Flash of Unstyled Content) before animation starts
    // Setting opacity here ensures they are hidden immediately when JS runs
    heroTitle.style.opacity = 0;
    heroTagline.style.opacity = 0;

    // Subtle cinematic hero entry animation
    if (typeof gsap !== 'undefined') {
        const tl = gsap.timeline({
            defaults: {
                ease: 'power2.out', // Smooth, calm easing without bounce
                duration: 2.4       // 2.2 - 2.5s duration
            }
        });

        tl.fromTo(heroTitle,
            {
                opacity: 0,
                y: 20,
                filter: 'blur(8px)', // Start slightly blurred
                letterSpacing: '0.15em', // Start with slightly wider spacing
                textShadow: '0 0 0 rgba(200, 200, 200, 0)' // Start with no shadow
            },
            {
                opacity: 1,
                y: 0,
                filter: 'blur(0px)', // Animate to sharp focus
                letterSpacing: '0.05em', // Normal spacing
                textShadow: '0 2px 10px rgba(200, 200, 200, 0.1)' // Very soft text shadow for depth
            }
        )
            .fromTo(heroTagline,
                {
                    opacity: 0,
                    y: 20
                },
                { opacity: 1, y: 0 },
                "-=1.4" // Small delay (Wait until title is partially animated before starting: 2.4 - 1.4 = 1.0s delay)
            );
    } else {
        console.warn('GSAP library not found. Skipping entry animations.');
        // Fallback for missing GSAP
        heroTitle.style.opacity = 1;
        heroTagline.style.opacity = 1;
    }

    // --- Cinematic Scroll Reveal System (ScrollTrigger) ---
    if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
        gsap.registerPlugin(ScrollTrigger, ScrollToPlugin);


    }
    // --- Cinematic Hero Scroll Depth (Subtle Parallax) ---
    // Three layers at slightly different scroll speeds create depth illusion.
    if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
        const hero = document.querySelector('.hero');
        const heroAvatar = document.querySelector('.hero-avatar');
        const polygonBg = document.getElementById('polygon-bg');

        if (hero) {
            // Background: moves slower (lags ~10%)
            if (polygonBg) {
                gsap.to(polygonBg, {
                    yPercent: 8,
                    ease: 'none',
                    scrollTrigger: {
                        trigger: hero,
                        start: 'top top',
                        end: 'bottom top',
                        scrub: true
                    }
                });
            }

            // Avatar eyes: moves slightly slower than text (lags ~5%)
            if (heroAvatar) {
                gsap.to(heroAvatar, {
                    yPercent: 15,
                    ease: 'none',
                    scrollTrigger: {
                        trigger: hero,
                        start: 'top top',
                        end: 'bottom top',
                        scrub: true
                    }
                });
            }
        }
    }

    // --- Interactive Avatar Eye Tracking ---
    const eyeParts = [
        document.getElementById('left-eye'),
        document.getElementById('left-eye-left'),
        document.getElementById('left-eye-right'),
        document.getElementById('right-eye'),
        document.getElementById('right-eye-left'),
        document.getElementById('right-eye-right')
    ].filter(el => el !== null); // Only keep the parts that exist

    const heroAvatarContainer = document.querySelector('.hero-avatar');

    if (eyeParts.length > 0 && heroAvatarContainer) {
        document.addEventListener('mousemove', (e) => {
            const rect = heroAvatarContainer.getBoundingClientRect();
            const centerX = rect.left + rect.width / 2;
            const centerY = rect.top + rect.height / 2;

            // Calculate cursor offset from center of avatar
            const deltaX = e.clientX - centerX;
            const deltaY = e.clientY - centerY;

            // Maximum displacement (px) - Increased significantly to make tracking obvious
            const maxMoveX = 22;
            const maxMoveY = 12;

            // Simple distance factor based roughly on how close the cursor is
            const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
            const strength = Math.min(distance / 500, 1); // Peak strength at 500px away 

            let moveX = 0;
            let moveY = 0;

            if (distance > 0) {
                // We use different X/Y max moves because eyes are typically wider than they are tall
                moveX = (deltaX / distance) * (maxMoveX * strength);
                moveY = (deltaY / distance) * (maxMoveY * strength);
            }

            // Move all parts of the eye
            eyeParts.forEach(part => {
                part.style.transform = `translate(${moveX}px, ${moveY}px)`;
            });
        });

        // Reset eyes when cursor leaves the window bounds completely
        document.body.addEventListener('mouseleave', () => {
            eyeParts.forEach(part => {
                part.style.transform = 'translate(0px, 0px)';
            });
        });
    }

    // --- Dynamic Line-Intersection Polygon Mesh (Canvas) ---
    // Vertical lines at slight angles move across the canvas.
    // Their intersections naturally divide the plane into polygon regions,
    // each filled with a unique subtle shade of grey.
    const canvas = document.getElementById('polygon-bg');
    if (canvas) {
        const ctx = canvas.getContext('2d');
        let width, height;
        let lines = [];
        const config = {
            numLines: 12,
            speed: 0.85,      // Matches previous movement speed
            lineAlpha: 0.08   // Faint line visibility
        };

        function resizeCanvas() {
            const dpr = window.devicePixelRatio || 1;
            width = window.innerWidth;
            height = window.innerHeight;
            canvas.width = width * dpr;
            canvas.height = height * dpr;
            ctx.scale(dpr, dpr);
            initLines();
        }

        // Each line spans from (topX, 0) to (bottomX, canvasHeight).
        // Top and bottom endpoints drift independently, giving each line
        // a slowly changing angle — which shifts where intersections occur.
        class MovingLine {
            constructor() {
                this.topX = Math.random() * (width + 400) - 200;
                this.bottomX = Math.random() * (width + 400) - 200;
                this.topVx = (Math.random() - 0.5) * config.speed;
                this.bottomVx = (Math.random() - 0.5) * config.speed;
                // Unique ID for shade computation
                this.id = Math.floor(Math.random() * 100);
            }

            update() {
                this.topX += this.topVx;
                this.bottomX += this.bottomVx;

                // Wrap around with offscreen buffer
                if (this.topX < -300) this.topX = width + 300;
                else if (this.topX > width + 300) this.topX = -300;
                if (this.bottomX < -300) this.bottomX = width + 300;
                else if (this.bottomX > width + 300) this.bottomX = -300;
            }

            // Linear interpolation: x position at a given y
            getXAtY(y) {
                const t = y / height;
                return this.topX + (this.bottomX - this.topX) * t;
            }
        }

        function initLines() {
            lines = [];
            for (let i = 0; i < config.numLines; i++) {
                lines.push(new MovingLine());
            }
        }

        // Find the y-coordinate where two lines cross.
        // Returns null if they are parallel or cross outside the canvas.
        function getIntersectionY(a, b) {
            const dA = a.bottomX - a.topX;
            const dB = b.bottomX - b.topX;
            const denom = dA - dB;
            if (Math.abs(denom) < 0.001) return null; // nearly parallel

            const t = (b.topX - a.topX) / denom;
            if (t < 0 || t > 1) return null; // intersection is above or below canvas
            return t * height;
        }

        function animate() {
            ctx.clearRect(0, 0, width, height);
            lines.forEach(line => line.update());

            // --- 1. Collect all y-values where line ordering changes ---
            const yBreaks = [0, height];
            for (let i = 0; i < lines.length; i++) {
                for (let j = i + 1; j < lines.length; j++) {
                    const y = getIntersectionY(lines[i], lines[j]);
                    if (y !== null && y > 0 && y < height) {
                        yBreaks.push(y);
                    }
                }
            }

            // Sort and deduplicate
            yBreaks.sort((a, b) => a - b);
            const bands = [yBreaks[0]];
            for (let i = 1; i < yBreaks.length; i++) {
                if (yBreaks[i] - bands[bands.length - 1] > 0.5) {
                    bands.push(yBreaks[i]);
                }
            }

            // --- 2. For each horizontal band, sort lines by x and fill polygons ---
            for (let b = 0; b < bands.length - 1; b++) {
                const yTop = bands[b];
                const yBot = bands[b + 1];
                const yMid = (yTop + yBot) / 2;

                // Sort lines by their x-position at the band's midpoint
                const sorted = lines.map((line, idx) => ({
                    idx,
                    x: line.getXAtY(yMid)
                })).sort((a, b) => a.x - b.x);

                // Draw the polygon (quadrilateral) between each consecutive pair
                for (let i = 0; i < sorted.length - 1; i++) {
                    const lineL = lines[sorted[i].idx];
                    const lineR = lines[sorted[i + 1].idx];

                    const x1 = lineL.getXAtY(yTop);
                    const x2 = lineR.getXAtY(yTop);
                    const x3 = lineR.getXAtY(yBot);
                    const x4 = lineL.getXAtY(yBot);

                    // Derive a unique shade from the pair of line IDs
                    // This ensures each polygon region has a consistent, distinct shade
                    const idA = lines[sorted[i].idx].id;
                    const idB = lines[sorted[i + 1].idx].id;
                    const seed = idA * 7 + idB * 13;
                    const shade = (seed % 35) + 135;            // grey range: 135–170
                    const opacity = 0.015 + ((seed % 25) / 25) * 0.035; // range: 0.015–0.05

                    ctx.beginPath();
                    ctx.moveTo(x1, yTop);
                    ctx.lineTo(x2, yTop);
                    ctx.lineTo(x3, yBot);
                    ctx.lineTo(x4, yBot);
                    ctx.closePath();
                    ctx.fillStyle = `rgba(${shade}, ${shade}, ${shade}, ${opacity})`;
                    ctx.fill();
                }
            }

            // --- 3. Draw the lines themselves (very faint) ---
            lines.forEach(line => {
                ctx.beginPath();
                ctx.moveTo(line.topX, 0);
                ctx.lineTo(line.bottomX, height);
                ctx.strokeStyle = `rgba(180, 180, 180, ${config.lineAlpha})`;
                ctx.lineWidth = 0.5;
                ctx.stroke();
            });

            requestAnimationFrame(animate);
        }

        window.addEventListener('resize', resizeCanvas);
        resizeCanvas();
        animate();
    }

    // --- Cinematic Magnetic Cursor Interactions ---
    // Elements subtly drift toward the cursor when hovered, like they're aware of presence.
    if (typeof gsap !== 'undefined') {
        const magneticElements = document.querySelectorAll('.project-panel, .contact-link');

        magneticElements.forEach((el) => {
            // Promote to GPU layer for smooth transform without layout shift
            el.style.willChange = 'transform';

            el.addEventListener('mousemove', (e) => {
                const rect = el.getBoundingClientRect();
                // Cursor position relative to element center (-1 to 1 range)
                const relX = (e.clientX - rect.left) / rect.width - 0.5;
                const relY = (e.clientY - rect.top) / rect.height - 0.5;

                // Max 8px displacement toward cursor
                gsap.to(el, {
                    x: relX * 16,  // -0.5 to 0.5 × 16 = -8 to 8px
                    y: relY * 16,
                    duration: 0.4,
                    ease: 'power2.out',
                    overwrite: 'auto'
                });
            });

            el.addEventListener('mouseleave', () => {
                gsap.to(el, {
                    x: 0,
                    y: 0,
                    duration: 0.7,
                    ease: 'power2.out',
                    overwrite: 'auto'
                });
            });
        });
    }

    // --- Subtle Eye-Tracking Interaction ---
    // Pupils follow the cursor with smooth, limited movement.
    if (typeof gsap !== 'undefined') {
        const pupilLeft = document.getElementById('pupil-left');
        const pupilRight = document.getElementById('pupil-right');
        const avatarSvg = document.querySelector('.hero-avatar svg');

        if (pupilLeft && pupilRight && avatarSvg) {
            // Eye centers in SVG coordinate space (from the viewBox)
            const leftEyeCenter = { cx: 42, cy: 36 };
            const rightEyeCenter = { cx: 118, cy: 36 };
            const maxOffset = 7; // Max pupil offset in SVG units — keeps r=6 pupil inside almond eye

            function updatePupils(mouseX, mouseY) {
                const svgRect = avatarSvg.getBoundingClientRect();
                // Convert screen coords to SVG viewBox coords
                // viewBox is 0 0 160 80, element has svgRect dimensions
                const scaleX = 160 / svgRect.width;
                const scaleY = 80 / svgRect.height;
                const svgMouseX = (mouseX - svgRect.left) * scaleX;
                const svgMouseY = (mouseY - svgRect.top) * scaleY;

                [
                    { el: pupilLeft, center: leftEyeCenter },
                    { el: pupilRight, center: rightEyeCenter }
                ].forEach(({ el, center }) => {
                    const dx = svgMouseX - center.cx;
                    const dy = svgMouseY - center.cy;
                    const dist = Math.sqrt(dx * dx + dy * dy);

                    // Normalize and clamp to maxOffset
                    const clampedDist = Math.min(dist, maxOffset * 8);
                    const ratio = clampedDist > 0 ? maxOffset / Math.max(dist, maxOffset) : 0;
                    const offsetX = dx * ratio;
                    const offsetY = dy * ratio;

                    gsap.to(el, {
                        attr: { cx: center.cx + offsetX, cy: center.cy + offsetY },
                        duration: 0.7,
                        ease: 'power3.out',
                        overwrite: 'auto'
                    });
                });
            }

            document.addEventListener('mousemove', (e) => {
                updatePupils(e.clientX, e.clientY);
            });

            // Return to center when cursor leaves the window
            document.addEventListener('mouseleave', () => {
                gsap.to(pupilLeft, {
                    attr: { cx: leftEyeCenter.cx, cy: leftEyeCenter.cy },
                    duration: 0.8,
                    ease: 'power2.out',
                    overwrite: 'auto'
                });
                gsap.to(pupilRight, {
                    attr: { cx: rightEyeCenter.cx, cy: rightEyeCenter.cy },
                    duration: 0.8,
                    ease: 'power2.out',
                    overwrite: 'auto'
                });
            });

            // --- Natural Blinking System ---
            const eyeLeft = document.getElementById('eye-left');
            const eyeRight = document.getElementById('eye-right');
            const clipPathL = document.getElementById('clip-path-l');
            const clipPathR = document.getElementById('clip-path-r');

            // SVG Path strings for open and closed states
            const leftEyeOpen = 'M16 36 Q42 18 68 36 Q42 52 16 36Z';
            const leftEyeClosed = 'M16 36 Q42 36 68 36 Q42 36 16 36Z';
            const rightEyeOpen = 'M92 36 Q118 18 144 36 Q118 52 92 36Z';
            const rightEyeClosed = 'M92 36 Q118 36 144 36 Q118 36 92 36Z';

            if (eyeLeft && eyeRight && clipPathL && clipPathR) {
                function blink() {
                    const tl = gsap.timeline();

                    // Close quickly
                    tl.to([eyeLeft, clipPathL], { attr: { d: leftEyeClosed }, duration: 0.15, ease: 'power2.inOut' }, 0)
                        .to([eyeRight, clipPathR], { attr: { d: rightEyeClosed }, duration: 0.15, ease: 'power2.inOut' }, 0)
                        // Short pause (80ms), then open smoothly
                        .to([eyeLeft, clipPathL], { attr: { d: leftEyeOpen }, duration: 0.2, ease: 'power2.out' }, '+=0.08')
                        .to([eyeRight, clipPathR], { attr: { d: rightEyeOpen }, duration: 0.2, ease: 'power2.out' }, '<');

                    // Schedule next blink (random between 1.5s and 4.5s)
                    const nextBlink = 1500 + Math.random() * 3000;
                    setTimeout(blink, nextBlink);
                }

                // Start first blink after 2s
                setTimeout(blink, 2000);
            }
        }
    }

    // --- Cinematic Navigation System ---
    if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
        const siteNav = document.getElementById('site-nav');
        const navLinks = document.querySelectorAll('.nav-link');
        const navIndicator = document.querySelector('.nav-indicator');
        const navLinksContainer = document.querySelector('.nav-links');

        if (siteNav && navLinks.length > 0 && navIndicator) {

            // --- 1. Show/hide glass nav background based on scroll ---
            const heroSection = document.querySelector('.hero');
            window.addEventListener('scroll', () => {
                const showThreshold = heroSection ? heroSection.offsetHeight * 0.8 : window.innerHeight * 0.8;
                if (window.scrollY > showThreshold) {
                    siteNav.classList.add('is-scrolled');
                } else {
                    siteNav.classList.remove('is-scrolled');
                }
            });

            // --- 2. Move indicator to active link ---
            function moveIndicator(link) {
                if (!link) return;
                const linkRect = link.getBoundingClientRect();
                const containerRect = navLinksContainer.getBoundingClientRect();

                // Use CSS transitions instead of GSAP for the indicator
                navIndicator.style.left = `${linkRect.left - containerRect.left}px`;
                navIndicator.style.width = `${linkRect.width}px`;
            }

            // --- 3. Active section detection via IntersectionObserver ---
            const sectionIds = ['skills-preview', 'projects-preview', 'experience', 'achievements', 'certifications', 'contact'];

            // IntersectionObserver properly identifies when a section spans the viewport
            // Adjusted margins trigger the indicator slightly earlier
            const observerOptions = {
                root: null,
                rootMargin: '-20% 0px -60% 0px',
                threshold: 0
            };

            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        setActiveLink(entry.target.id);
                    }
                });
            }, observerOptions);

            sectionIds.forEach((id) => {
                const section = document.getElementById(id);
                if (section) observer.observe(section);
            });

            function setActiveLink(sectionId) {
                navLinks.forEach(link => link.classList.remove('is-active'));
                const activeLink = document.querySelector(`.nav-link[data-section="${sectionId}"]`);
                if (activeLink) {
                    activeLink.classList.add('is-active');
                    moveIndicator(activeLink);
                }
            }

            // Update indicator on resize to maintain correct position
            window.addEventListener('resize', () => {
                const activeLink = document.querySelector('.nav-link.is-active');
                if (activeLink) moveIndicator(activeLink);
            });

            // --- 4. Smooth scroll on click ---
            navLinks.forEach(link => {
                link.addEventListener('click', (e) => {
                    e.preventDefault();
                    const targetId = link.getAttribute('data-section');
                    const targetSection = document.getElementById(targetId);
                    if (targetSection) {
                        const navHeight = siteNav.classList.contains('is-scrolled') ? siteNav.offsetHeight : 80;
                        gsap.to(window, {
                            scrollTo: { y: targetSection, offsetY: navHeight },
                            duration: 1.2,
                            ease: 'power2.inOut'
                        });
                    }
                });
            });
        }
    }

    // --- Interactive Terminal System ---
    const terminalInput = document.getElementById('terminal-input');
    const terminalOutput = document.getElementById('terminal-output');
    const terminalBody = document.getElementById('terminal-body');
    const terminalInputLine = document.getElementById('terminal-input-line');
    const terminalInputMirror = document.getElementById('terminal-input-mirror');

    if (terminalInput && terminalOutput && terminalBody && terminalInputLine && terminalInputMirror) {

        // Typing Animation Sequence
        const startupLines = [
            "Connecting to Bhavesh's system...",
            "Access granted.",
            "Type 'help' to begin."
        ];

        let lineIndex = 0;
        let charIndex = 0;
        let typingTimeout = null;

        function typeStartupSequence() {
            if (lineIndex < startupLines.length) {
                if (charIndex === 0) {
                    // Create new line
                    const tempDiv = document.createElement('div');
                    tempDiv.className = 'terminal-sysmsg';
                    tempDiv.id = `startup-line-${lineIndex}`;
                    terminalOutput.appendChild(tempDiv);
                }

                const currentLineEl = document.getElementById(`startup-line-${lineIndex}`);
                if (charIndex < startupLines[lineIndex].length) {
                    currentLineEl.textContent += startupLines[lineIndex].charAt(charIndex);
                    charIndex++;
                    typingTimeout = setTimeout(typeStartupSequence, Math.random() * 30 + 20); // Random typing speed
                } else {
                    // Line finished, go to next
                    lineIndex++;
                    charIndex = 0;
                    typingTimeout = setTimeout(typeStartupSequence, 300); // Pause between lines
                }
                // Scroll down
                terminalBody.scrollTop = terminalBody.scrollHeight;
            } else {
                // Done with typing, show input line
                terminalInputLine.style.display = 'flex';
                terminalBody.scrollTop = terminalBody.scrollHeight;
                // terminalInput.focus(); // Removed to prevent auto-scrolling on page load
            }
        }

        // Trigger on scroll via IntersectionObserver
        const contactObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    // Check if user has entered any non-startup commands
                    const hasUserCommands = Array.from(terminalOutput.children).some(
                        child => !child.classList.contains('terminal-sysmsg')
                    );

                    if (!hasUserCommands) {
                        // Reset the typing state
                        clearTimeout(typingTimeout);
                        terminalOutput.innerHTML = '';
                        terminalInputLine.style.display = 'none';
                        lineIndex = 0;
                        charIndex = 0;
                        typeStartupSequence();
                    }
                }
            });
        }, { threshold: 0.1 });

        const contactSection = document.getElementById('contact');
        if (contactSection) {
            contactObserver.observe(contactSection);
        }

        // Sync hidden input to the visual mirror span
        terminalInput.addEventListener('input', () => {
            terminalInputMirror.textContent = terminalInput.value;
        });

        // Ensure click anywhere on terminal focuses the input
        terminalBody.addEventListener('click', () => {
            // Only focus if typing is done
            if (terminalInputLine.style.display === 'flex') {
                terminalInput.focus();
            }
        });

        terminalInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                const command = terminalInput.value.trim().toLowerCase();

                // Clear input early to make it feel responsive
                terminalInput.value = '';
                terminalInputMirror.textContent = '';

                if (command === 'clear') {
                    // Remove command history but keep startup banner
                    Array.from(terminalOutput.children).forEach(child => {
                        if (!child.classList.contains('terminal-sysmsg')) {
                            child.remove();
                        }
                    });

                    // Auto-scroll to top of new cleared view
                    terminalBody.scrollTop = 0;
                    return;
                }

                if (command !== '') {
                    // Print the typed command to output exactly as prompt looks
                    printToTerminal(`<div class="cmd-line"><span class="terminal-prompt">bhavesh@portfolio:~$</span><span class="cmd">${command}</span></div>`);
                    processCommand(command);
                } else {
                    // Just print empty prompt line
                    printToTerminal(`<div class="cmd-line"><span class="terminal-prompt">bhavesh@portfolio:~$</span></div>`);
                }
            }
        });

        function printToTerminal(htmlString) {
            const tempDiv = document.createElement('div');
            tempDiv.className = 'terminal-history-item';
            tempDiv.innerHTML = htmlString;
            terminalOutput.appendChild(tempDiv);

            // Auto-scroll to bottom
            terminalBody.scrollTop = terminalBody.scrollHeight;
        }

        function processCommand(cmd) {
            const data = window._portfolioData || {};
            const contactInfo = data.contact || {
                email: 'bhaveshpatil7504@gmail.com',
                phone: '+91 7498503673',
                github: 'https://github.com/Bhaveshpatil75',
                linkedin: 'https://www.linkedin.com/in/bhavesh-patil-a2668b213/'
            };
            const resumeLink = (data.resume && data.resume.file) ? data.resume.file : 'assets/resume/Bhavesh_Patil_Resume.pdf';

            switch (cmd) {
                case 'help':
                    printToTerminal(`<span class="out">Available commands:</span>
<span class="out">help     - Display available commands.</span>
<span class="out">contact  - Show email and phone.</span>
<span class="out">github   - Open GitHub profile in a new tab.</span>
<span class="out">linkedin - Open LinkedIn profile in a new tab.</span>
<span class="out">resume   - Open resume in new tab.</span>
<span class="out">clear    - Clear terminal screen.</span>`);
                    break;
                case 'contact':
                    printToTerminal(`<span class="out">Email: ${contactInfo.email}</span>
<span class="out">Phone: ${contactInfo.phone}</span>`);
                    break;
                case 'github':
                    printToTerminal(`<span class="out">Opening GitHub profile...</span>`);
                    setTimeout(() => window.open(contactInfo.github, '_blank'), 400);
                    break;
                case 'linkedin':
                    printToTerminal(`<span class="out">Opening LinkedIn profile...</span>`);
                    setTimeout(() => window.open(contactInfo.linkedin, '_blank'), 400);
                    break;
                case 'resume':
                    printToTerminal(`<span class="out">Opening resume...</span>`);
                    setTimeout(() => window.open(resumeLink, '_blank'), 400);
                    break;
                case 'sudo':
                case 'su':
                    printToTerminal(`<span class="out">bhavesh is not in the sudoers file. This incident will be reported.</span>`);
                    break;
                default:
                    printToTerminal(`<span class="out">bash: ${cmd}: command not found</span>`);
                    break;
            }
        }
    }
});
