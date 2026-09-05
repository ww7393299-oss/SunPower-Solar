/* ==========================================================================
   SUNPOWER ENERGY - 3D CANVAS & MATHEMATICAL CALCULATOR ENGINE
   Founded by Naresh Yadav
   ========================================================================== */

// --------------------------------------------------------------------------
// 1. INTERACTIVE 3D SOLAR PANEL CANVAS ENGINE (360° Drag & Rotate)
// --------------------------------------------------------------------------
class Solar3DViewer {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) return;
        this.ctx = this.canvas.getContext("2d");

        // 3D Orientation state
        this.angleY = 35; // degrees Y rotation (0-360)
        this.tiltX = 30;  // degrees X tilt
        this.sunAngle = 45; // Sun light angle
        this.techType = "TOPCon"; // TOPCon vs PERC

        this.isDragging = false;
        this.lastMouseX = 0;
        this.lastMouseY = 0;

        this.initEvents();
        this.animate();
    }

    initEvents() {
        // Drag to rotate listeners
        this.canvas.addEventListener("mousedown", (e) => {
            this.isDragging = true;
            this.lastMouseX = e.clientX;
            this.lastMouseY = e.clientY;
        });

        window.addEventListener("mousemove", (e) => {
            if (!this.isDragging) return;
            const deltaX = e.clientX - this.lastMouseX;
            const deltaY = e.clientY - this.lastMouseY;

            this.angleY = (this.angleY + deltaX * 0.8) % 360;
            this.tiltX = Math.max(5, Math.min(75, this.tiltX - deltaY * 0.5));

            this.lastMouseX = e.clientX;
            this.lastMouseY = e.clientY;
        });

        window.addEventListener("mouseup", () => { this.isDragging = false; });

        // Touch support
        this.canvas.addEventListener("touchstart", (e) => {
            if (e.touches.length === 1) {
                this.isDragging = true;
                this.lastMouseX = e.touches[0].clientX;
                this.lastMouseY = e.touches[0].clientY;
            }
        });

        this.canvas.addEventListener("touchmove", (e) => {
            if (!this.isDragging || e.touches.length !== 1) return;
            const deltaX = e.touches[0].clientX - this.lastMouseX;
            const deltaY = e.touches[0].clientY - this.lastMouseY;

            this.angleY = (this.angleY + deltaX * 0.8) % 360;
            this.tiltX = Math.max(5, Math.min(75, this.tiltX - deltaY * 0.5));

            this.lastMouseX = e.touches[0].clientX;
            this.lastMouseY = e.touches[0].clientY;
        });

        this.canvas.addEventListener("touchend", () => { this.isDragging = false; });
    }

    draw() {
        const width = this.canvas.width;
        const height = this.canvas.height;
        const ctx = this.ctx;

        ctx.clearRect(0, 0, width, height);

        const centerX = width / 2;
        const centerY = height / 2 + 10;

        // Convert angles to radians
        const radY = (this.angleY * Math.PI) / 180;
        const radX = (this.tiltX * Math.PI) / 180;

        // Panel dimensions
        const pWidth = 280;
        const pHeight = 180;

        // Draw Sun Ray particles background
        const sunRad = (this.sunAngle * Math.PI) / 180;
        const sunX = centerX + Math.cos(sunRad) * 220;
        const sunY = centerY - Math.sin(sunRad) * 140;

        // Draw Sun glow
        const sunGrad = ctx.createRadialGradient(sunX, sunY, 5, sunX, sunY, 50);
        sunGrad.addColorStop(0, "rgba(245, 158, 11, 0.9)");
        sunGrad.addColorStop(0.5, "rgba(245, 158, 11, 0.3)");
        sunGrad.addColorStop(1, "rgba(245, 158, 11, 0)");
        ctx.fillStyle = sunGrad;
        ctx.beginPath();
        ctx.arc(sunX, sunY, 50, 0, Math.PI * 2);
        ctx.fill();

        // 3D projection function
        const project = (x, y, z) => {
            // Y rotation
            let x1 = x * Math.cos(radY) - z * Math.sin(radY);
            let z1 = x * Math.sin(radY) + z * Math.cos(radY);

            // X tilt
            let y2 = y * Math.cos(radX) - z1 * Math.sin(radX);
            let z2 = y * Math.sin(radX) + z1 * Math.cos(radX);

            return {
                x: centerX + x1,
                y: centerY + y2
            };
        };

        // Panel Corners (Local 3D space)
        const hw = pWidth / 2;
        const hh = pHeight / 2;

        const corners = [
            project(-hw, 0, -hh), // Top-left
            project(hw, 0, -hh),  // Top-right
            project(hw, 0, hh),   // Bottom-right
            project(-hw, 0, hh)   // Bottom-left
        ];

        // Draw Frame Backing & Aluminum Rim
        ctx.beginPath();
        ctx.moveTo(corners[0].x, corners[0].y);
        corners.forEach(c => ctx.lineTo(c.x, c.y));
        ctx.closePath();
        ctx.fillStyle = "#1e293b";
        ctx.strokeStyle = "#64748b";
        ctx.lineWidth = 6;
        ctx.stroke();
        ctx.fill();

        // Draw Glass Reflection Surface
        const isTOPCon = this.techType === "TOPCon";
        const glassGrad = ctx.createLinearGradient(corners[0].x, corners[0].y, corners[2].x, corners[2].y);
        glassGrad.addColorStop(0, isTOPCon ? "#0a192f" : "#111827");
        glassGrad.addColorStop(0.5, isTOPCon ? "#1e3a8a" : "#1f2937");
        glassGrad.addColorStop(1, isTOPCon ? "#0284c7" : "#374151");

        ctx.fillStyle = glassGrad;
        ctx.fill();

        // Draw Solar Cell Grid (6 columns x 10 rows)
        const cols = 6;
        const rows = 8;
        const cellW = pWidth / cols;
        const cellH = pHeight / rows;

        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                const lx = -hw + c * cellW + 2;
                const lz = -hh + r * cellH + 2;
                const lw = cellW - 4;
                const lh = cellH - 4;

                const cp1 = project(lx, -1, lz);
                const cp2 = project(lx + lw, -1, lz);
                const cp3 = project(lx + lw, -1, lz + lh);
                const cp4 = project(lx, -1, lz + lh);

                ctx.beginPath();
                ctx.moveTo(cp1.x, cp1.y);
                ctx.lineTo(cp2.x, cp2.y);
                ctx.lineTo(cp3.x, cp3.y);
                ctx.lineTo(cp4.x, cp4.y);
                ctx.closePath();

                ctx.fillStyle = isTOPCon ? "rgba(2, 132, 199, 0.4)" : "rgba(31, 41, 55, 0.6)";
                ctx.strokeStyle = "rgba(255, 255, 255, 0.15)";
                ctx.lineWidth = 1;
                ctx.fill();
                ctx.stroke();

                // Draw Busbars (Metallic silver line down center)
                const bb1 = project(lx + lw / 2, -2, lz);
                const bb2 = project(lx + lw / 2, -2, lz + lh);
                ctx.beginPath();
                ctx.moveTo(bb1.x, bb1.y);
                ctx.lineTo(bb2.x, bb2.y);
                ctx.strokeStyle = "rgba(226, 232, 240, 0.6)";
                ctx.lineWidth = 1;
                ctx.stroke();
            }
        }

        // Draw Sun Ray Reflection Glare
        const glareGrad = ctx.createLinearGradient(sunX, sunY, corners[2].x, corners[2].y);
        glareGrad.addColorStop(0, "rgba(255, 255, 255, 0.25)");
        glareGrad.addColorStop(1, "rgba(255, 255, 255, 0)");

        ctx.fillStyle = glareGrad;
        ctx.beginPath();
        ctx.moveTo(corners[0].x, corners[0].y);
        corners.forEach(c => ctx.lineTo(c.x, c.y));
        ctx.closePath();
        ctx.fill();
    }

    animate() {
        if (!this.isDragging) {
            this.angleY = (this.angleY + 0.15) % 360; // Subtle idle rotation
        }
        this.draw();
        requestAnimationFrame(() => this.animate());
    }
}

// --------------------------------------------------------------------------
// 2. MATHEMATICAL SOLAR ROI & SUBSIDY CALCULATOR ENGINE
// --------------------------------------------------------------------------
function calculateSolarMetrics() {
    const bill = parseFloat(document.getElementById("billSlider").value);
    const area = parseFloat(document.getElementById("areaSlider").value);
    const tariff = parseFloat(document.getElementById("tariffSlider").value);

    // Math Formulas
    // 1. Required kW based on bill (e.g. ₹1,200 bill per kW) and Roof Area capacity (100 sq ft per kW)
    const kwByBill = bill / 1200;
    const kwByArea = area / 100;
    const systemKw = Math.max(1, Math.min(kwByArea, kwByBill));

    // 2. Daily & Annual Generation (Average 4.5 kWh per kW per day in India)
    const dailyUnits = systemKw * 4.5;
    const annualUnits = dailyUnits * 365;

    // 3. Gross Installation Cost (₹55,000 per kW average turnkey benchmark)
    const grossCost = systemKw * 55000;

    // 4. PM Surya Ghar Muft Bijli Yojana Subsidy Calculation:
    // - Up to 2 kW: ₹30,000 / kW (Max ₹60,000)
    // - 2 kW to 3 kW: ₹18,000 for 3rd kW (Max ₹78,000)
    // - Above 3 kW: Fixed max ₹78,000 subsidy
    let subsidy = 0;
    if (systemKw <= 2) {
        subsidy = systemKw * 30000;
    } else if (systemKw <= 3) {
        subsidy = 60000 + (systemKw - 2) * 18000;
    } else {
        subsidy = 78000;
    }

    // 5. Net Cost & Annual Financial Savings
    const netCost = Math.max(0, grossCost - subsidy);
    const annualSavings = annualUnits * tariff;

    // 6. Payback Period (Years)
    const paybackYears = annualSavings > 0 ? (netCost / annualSavings) : 0;

    // 7. 25-Year Cumulative Savings with 5% annual grid tariff rise
    let cumSavings = 0;
    let currentTariff = tariff;
    for (let yr = 1; yr <= 25; yr++) {
        cumSavings += annualUnits * currentTariff;
        currentTariff *= 1.05; // 5% annual tariff escalation
    }
    const net25YrSavings = cumSavings - netCost;

    // 8. Environmental Impact
    const co2Tons = (annualUnits * 0.82) / 1000; // 0.82 kg CO2 per kWh grid displacement
    const treesEquivalent = Math.round(co2Tons * 50);

    // Update UI Elements
    document.getElementById("billVal").textContent = `₹${bill.toLocaleString('en-IN')} / month`;
    document.getElementById("areaVal").textContent = `${area.toLocaleString('en-IN')} sq ft`;
    document.getElementById("tariffVal").textContent = `₹${tariff.toFixed(2)} / kWh`;

    document.getElementById("calcSystemKw").textContent = `${systemKw.toFixed(1)} kW Plant`;
    document.getElementById("calcDailyUnits").textContent = `${dailyUnits.toFixed(1)} Units/day`;
    document.getElementById("calcAnnualUnits").textContent = `${Math.round(annualUnits).toLocaleString('en-IN')} kWh/yr`;
    document.getElementById("calcGrossCost").textContent = `₹${Math.round(grossCost).toLocaleString('en-IN')}`;
    document.getElementById("calcSubsidy").textContent = `- ₹${Math.round(subsidy).toLocaleString('en-IN')}`;
    document.getElementById("calcNetCost").textContent = `₹${Math.round(netCost).toLocaleString('en-IN')}`;
    document.getElementById("calcPayback").textContent = `${paybackYears.toFixed(1)} Years`;
    document.getElementById("calc25YrSavings").textContent = `₹${Math.round(net25YrSavings).toLocaleString('en-IN')}`;

    document.getElementById("calcTrees").textContent = `${treesEquivalent} Trees Equivalent Planted`;
    document.getElementById("calcCO2").textContent = `${co2Tons.toFixed(1)} Tons CO₂ Reduced/yr`;

    // Auto update Modal system size field
    document.getElementById("quoteKwSize").value = `${systemKw.toFixed(1)} kW System (₹${Math.round(subsidy).toLocaleString('en-IN')} Subsidy Eligible)`;
}

// --------------------------------------------------------------------------
// 3. TOAST & MODAL CONTROLLERS
// --------------------------------------------------------------------------
function showToast(msg) {
    const container = document.getElementById("toastContainer");
    const toast = document.createElement("div");
    toast.className = "toast";
    toast.innerHTML = `<i class="fa-solid fa-circle-check text-success"></i> <span>${msg}</span>`;
    container.appendChild(toast);
    setTimeout(() => {
        toast.style.opacity = "0";
        toast.style.transition = "all 0.3s ease";
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}

function scrollToCalc() {
    document.getElementById("calculator").scrollIntoView({ behavior: "smooth" });
}

// Initialization on DOM Ready
document.addEventListener("DOMContentLoaded", () => {
    // Launch 3D Solar Panel Canvas
    const viewer = new Solar3DViewer("solar3DCanvas");

    // Slider Event Listeners for Math Calculator
    document.getElementById("billSlider").addEventListener("input", calculateSolarMetrics);
    document.getElementById("areaSlider").addEventListener("input", calculateSolarMetrics);
    document.getElementById("tariffSlider").addEventListener("input", calculateSolarMetrics);

    // Initial Math Run
    calculateSolarMetrics();

    // 3D Controls
    document.getElementById("sunAngleSlider").addEventListener("input", (e) => {
        viewer.sunAngle = parseFloat(e.target.value);
        document.getElementById("sunAngleVal").textContent = `${e.target.value}°`;
    });

    document.getElementById("tiltAngleSlider").addEventListener("input", (e) => {
        viewer.tiltX = parseFloat(e.target.value);
        document.getElementById("tiltAngleVal").textContent = `${e.target.value}°`;
    });

    document.getElementById("reset3DBtn").addEventListener("click", () => {
        viewer.angleY = 35;
        viewer.tiltX = 30;
        viewer.sunAngle = 45;
        document.getElementById("sunAngleSlider").value = 45;
        document.getElementById("tiltAngleSlider").value = 30;
        document.getElementById("sunAngleVal").textContent = "45°";
        document.getElementById("tiltAngleVal").textContent = "30°";
    });

    document.getElementById("btnTechPerc").addEventListener("click", (e) => {
        viewer.techType = "TOPCon";
        document.getElementById("btnTechPerc").classList.add("active");
        document.getElementById("btnTechMono").classList.remove("active");
    });

    document.getElementById("btnTechMono").addEventListener("click", (e) => {
        viewer.techType = "PERC";
        document.getElementById("btnTechMono").classList.add("active");
        document.getElementById("btnTechPerc").classList.remove("active");
    });

    // Modal Triggers
    const modal = document.getElementById("quoteModal");
    document.getElementById("openQuoteModalBtn").addEventListener("click", () => modal.classList.add("active"));
    document.getElementById("applySubsidyQuoteBtn").addEventListener("click", () => modal.classList.add("active"));
    document.getElementById("closeQuoteModalBtn").addEventListener("click", () => modal.classList.remove("active"));

    // Form Submission
    document.getElementById("quoteForm").addEventListener("submit", (e) => {
        e.preventDefault();
        const name = document.getElementById("quoteName").value;
        modal.classList.remove("active");
        showToast(`Thank you ${name}! Your PM Surya Ghar Subsidy application & quote request was submitted. Our SunPower advisor will contact you shortly.`);
    });
});
