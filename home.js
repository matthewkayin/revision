var scroll_pos = window.scrollY;
window.onscroll = function(){

    var current_scroll_pos = window.scrollY;
    if(current_scroll_pos == 0){

        document.getElementById("header").style.top = "0px";

    }else{

        var current_top = document.getElementById("header").getBoundingClientRect().y;
        var scroll_offset = current_scroll_pos - scroll_pos;
        if(scroll_offset > 0 && current_top > -52){

            document.getElementById("header").style.top = String(Math.max(-52, current_top - scroll_offset)) + "px";

        }else if(scroll_offset < 0 && current_top < 0){

            document.getElementById("header").style.top = String(Math.min(0, current_top - scroll_offset)) + "px";
        }
        scroll_pos = current_scroll_pos;
    }
};

const THEME_LIGHT = 0;
const THEME_SOLARIZED = 1;
const THEME_DARK = 2;
var current_theme = THEME_LIGHT;
function toggle_theme(){

    current_theme += 1;
    if(current_theme > 2){

        current_theme = 0;
    }

    if(current_theme == THEME_LIGHT){

        document.documentElement.className = "theme-light";

    }else if(current_theme == THEME_SOLARIZED){

        document.documentElement.className = "theme-solarized";

    }else if(current_theme == THEME_DARK){

        document.documentElement.className = "theme-dark";
    }
}
