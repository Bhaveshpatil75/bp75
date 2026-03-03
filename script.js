// Cinematic Noir Portfolio

document.addEventListener('DOMContentLoaded', () => {
    console.log('Cinematic Noir Portfolio loaded.');

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
        gsap.registerPlugin(ScrollTrigger);

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
            lineAlpha: 0.1   // Faint line visibility
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
});
