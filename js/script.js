// Cinematic Noir Portfolio

document.addEventListener('DOMContentLoaded', () => {
    console.log('Cinematic Noir Portfolio loaded.');

    // --- Data Loader: Populate content from JSON ---
    async function loadPortfolioData() {
        try {
            const response = await fetch('data/data.json');
            if (!response.ok) throw new Error('Failed to load data');
            const data = await response.json();

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
        } catch (err) {
            console.warn('Portfolio data could not be loaded. Using fallback HTML content.', err);
        }
    }

    loadPortfolioData();

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

        // Sections to reveal on scroll
        const revealSections = document.querySelectorAll(
            '.about-section, .skills-section, .projects-section, .contact-section'
        );

        revealSections.forEach((section) => {
            // Use autoAlpha (combines opacity + visibility) to prevent layout shift
            // visibility:hidden reserves space, opacity:0 alone would too, but autoAlpha
            // cleanly toggles visibility:visible when opacity > 0
            gsap.set(section, { autoAlpha: 0, y: 40, scale: 0.96 });

            gsap.to(section, {
                autoAlpha: 1,
                y: 0,
                scale: 1,
                duration: 1.4,
                ease: 'power2.out',
                scrollTrigger: {
                    trigger: section,
                    start: 'top 78%',
                    end: 'bottom 20%',
                    toggleActions: 'play reverse play reverse'
                }
            });
        });

        // Staggered reveal for project panels
        const projectPanels = document.querySelectorAll('.project-panel');
        if (projectPanels.length > 0) {
            gsap.set(projectPanels, { autoAlpha: 0, y: 40, scale: 0.96 });

            gsap.to(projectPanels, {
                autoAlpha: 1,
                y: 0,
                scale: 1,
                duration: 1.4,
                ease: 'power2.out',
                stagger: 0.3,
                scrollTrigger: {
                    trigger: '.project-list',
                    start: 'top 78%',
                    end: 'bottom 20%',
                    toggleActions: 'play reverse play reverse'
                }
            });
        }
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

            // --- 1. Show/hide nav based on scroll past hero ---
            ScrollTrigger.create({
                trigger: '.hero',
                start: 'bottom 20%',
                onEnterBack: () => siteNav.classList.remove('is-visible'),
                onLeave: () => siteNav.classList.add('is-visible')
            });

            // --- 2. Move indicator to active link ---
            function moveIndicator(link) {
                if (!link) return;
                const linkRect = link.getBoundingClientRect();
                const containerRect = navLinksContainer.getBoundingClientRect();

                gsap.to(navIndicator, {
                    left: linkRect.left - containerRect.left,
                    width: linkRect.width,
                    duration: 0.5,
                    ease: 'power2.out'
                });
            }

            // --- 3. Active section detection via ScrollTrigger ---
            const sectionIds = ['about', 'skills', 'projects', 'contact'];

            sectionIds.forEach((id) => {
                const section = document.getElementById(id);
                if (!section) return;

                ScrollTrigger.create({
                    trigger: section,
                    start: 'top 50%',
                    end: 'bottom 50%',
                    onEnter: () => setActiveLink(id),
                    onEnterBack: () => setActiveLink(id)
                });
            });

            function setActiveLink(sectionId) {
                navLinks.forEach(link => link.classList.remove('is-active'));
                const activeLink = document.querySelector(`.nav-link[data-section="${sectionId}"]`);
                if (activeLink) {
                    activeLink.classList.add('is-active');
                    moveIndicator(activeLink);
                }
            }

            // --- 4. Smooth scroll on click ---
            navLinks.forEach(link => {
                link.addEventListener('click', (e) => {
                    e.preventDefault();
                    const targetId = link.getAttribute('data-section');
                    const targetSection = document.getElementById(targetId);
                    if (targetSection) {
                        gsap.to(window, {
                            scrollTo: { y: targetSection, offsetY: 60 },
                            duration: 1.2,
                            ease: 'power2.inOut'
                        });
                    }
                });
            });
        }
    }
});
