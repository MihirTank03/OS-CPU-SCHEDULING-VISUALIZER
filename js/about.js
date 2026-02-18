// ========== About Page JavaScript ==========

// Navigation Functions
function showMenu() {
    document.getElementById("navLinks").style.right = "0";
}

function hideMenu() {
    document.getElementById("navLinks").style.right = "-200px";
}

// Initialize AOS (Animate On Scroll)
document.addEventListener("DOMContentLoaded", function() {
    if (typeof AOS !== 'undefined') {
        AOS.init({
            offset: 200,
            duration: 600
        });
    }
});
