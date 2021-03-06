var scroll_pos = window.scrollY;
window.onscroll = function(){

    if(focus_scroll_point == -1){

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

    }else{

        var current_scroll_pos = window.scrollY;
        if((current_scroll_pos > focus_scroll_point && focus_scroll_direction == 1) || (current_scroll_pos < focus_scroll_point && focus_scroll_direction == -1)){

            window.scrollTo(0, focus_scroll_point);
            current_scroll_pos = window.scrollY;
        }
        if(current_scroll_pos == focus_scroll_point){

            focus_reader();

        }else{

            var scroll_offset = current_scroll_pos - scroll_pos;
            var current_header_top = document.getElementById("header").getBoundingClientRect().y;
            var current_navbar_top = document.getElementById("navbar").getBoundingClientRect().bottom;
            document.getElementById("header").style.top = String(Math.max(-52, current_header_top - Math.abs(scroll_offset))) + "px";
            document.getElementById("navbar").style.bottom = String(Math.max(-60, current_header_top - Math.abs(scroll_offset))) + "px";
        }
    }
};

const THEME_LIGHT = 0;
const THEME_SOLARIZED = 1;
const THEME_DARK = 2;
var current_theme = 0;
var initial_theme_loaded = false;
document.addEventListener("DOMContentLoaded", function(){

    if(!initial_theme_loaded){

        var xhr = new XMLHttpRequest();
        xhr.open("GET", "/get_theme", true);
        xhr.responseType = "json";
        xhr.onreadystatechange = function(){

            if(xhr.readyState == 4){

                current_theme = xhr.response.usertheme;
                update_theme();
            }
        };
        xhr.send();
        initial_theme_loaded = true;
    }
});
function toggle_theme(){

    current_theme += 1;
    if(current_theme > 2){

        current_theme = 0;
    }

    update_theme();
}
function update_theme(){

    if(current_theme == THEME_LIGHT){

        document.documentElement.className = "theme-light";

    }else if(current_theme == THEME_SOLARIZED){

        document.documentElement.className = "theme-solarized";

    }else if(current_theme == THEME_DARK){

        document.documentElement.className = "theme-dark";
    }

    var xhr = new XMLHttpRequest();
    xhr.open("POST", "/set_theme", true);
    xhr.setRequestHeader("Content-Type", "application/json");
    xhr.send(JSON.stringify({

        usertheme: current_theme
    }));
}

var focus_scroll_point = -1;
var focus_scroll_direction = 0;

function toggle_reader_focus(){

    if(focus_scroll_point != -1){

        return;
    }

    var currently_focused = document.getElementById("page-reader").style.overflowY == "scroll";

    if(currently_focused){

        document.getElementById("page-reader-scrollbar").style.height = "0px";
        document.getElementById("navbar").style.bottom = "0px";
        document.getElementById("page-reader").style.overflowY = "hidden";
        document.body.style.overflowY = "initial";
        document.getElementById("page-reader").style.border = "2px solid var(--dark-accent-color)";
        document.getElementById("page-reader").style.boxShadow = "1px 2px var(--dark-accent-color)";
        document.getElementById("page-reader").style.transitionDuration = "0.5s";
        document.getElementById("page-reader").style.height = "40vh";
        document.getElementById("page-reader").style.marginLeft = "13px";
        document.getElementById("page-reader").style.marginRight = "13px";
        document.getElementById("page-reader-scroll-assurance").style.height = "0";
        setTimeout(() => { document.getElementById("page-reader").style.transitionDuration = "0s" }, 500);

    }else{

        focus_scroll_point = document.getElementById("page-reader").offsetTop;
        document.getElementById("page-reader-scroll-assurance").style.height = "100vh";
        document.getElementById("page-reader").style.transitionDuration = "0.5s";
        document.getElementById("page-reader").style.height = "100vh";
        document.getElementById("page-reader").style.marginLeft = "0";
        document.getElementById("page-reader").style.marginRight = "0";
        if(focus_scroll_point == window.scrollY){

            focus_reader();

        }else{

            if(focus_scroll_point > window.scrollY){

                focus_scroll_direction = 1;

            }else{

                focus_scroll_direction = -1;
            }
            window.scrollTo({top: focus_scroll_point, behavior: "smooth"});
        }
    }
}

function focus_reader(){

    document.getElementById("page-reader").style.transitionDuration = "0s";
    document.getElementById("page-reader").style.border = "none";
    document.getElementById("page-reader").style.boxShadow = "none";
    document.getElementById("header").style.top = "-52px";
    document.getElementById("navbar").style.bottom = "-60px";
    document.body.style.overflow = "hidden";
    document.getElementById("page-reader").style.overflowY = "scroll";
    update_reader_scrollbar();
    document.getElementById("page-reader-scrollbar").style.height = "2px";
    focus_scroll_point = -1;
    focus_scroll_direction = 0;
}

function update_reader_scrollbar(){

    var max_width = window.innerWidth;
    var scroll_percent = document.getElementById("page-reader").scrollTop / (document.getElementById("page-reader").scrollHeight - window.innerHeight);
    var actual_width = max_width * scroll_percent;
    document.getElementById("page-reader-scrollbar").style.width = String(actual_width) + "px";
}

function toggle_like(heart){

    // format: like-button-#
    // number starts at index 12
    var post_id = Number(heart.id.substring(12));
    var currently_liked = heart.innerHTML == String.fromCharCode(0xe800);
    var add_like = 0;

    if(currently_liked){

        heart.innerHTML = String.fromCharCode(0xe801);
        add_like = -1;

    }else{

        heart.innerHTML = String.fromCharCode(0xe800);
        add_like = 1;
    }

    var previous_html = heart.parentNode.innerHTML;
    var prefix = previous_html.substring(0, previous_html.indexOf("</span> ") + 7);
    var suffix = Number(previous_html.substring(previous_html.indexOf("</span> ") + 8));
    heart.parentNode.innerHTML = prefix + " " + String(suffix + add_like);

    var xhr = new XMLHttpRequest();
    xhr.open("POST", "/like", true);
    xhr.setRequestHeader("Content-Type", "application/json");
    xhr.send(JSON.stringify({

        postid: post_id,
        liked: !currently_liked
    }));
}

function handle_follow_or_revise_button(button){

    // format: follow-button-#
    // number starts at index 14
    var post_id = Number(button.id.substring(14));

    if(button.innerHTML == "Revise"){

        location.href = '/revisions?postid=' + String(post_id);

    }else{

        toggle_follow(button, post_id);
    }
}

function toggle_follow(button, post_id){

    var currently_followed = button.innerHTML == "Unfollow";

    if(currently_followed){

        button.innerHTML = "Follow";
        button.classList.remove("filled");

    }else{

        button.innerHTML = "Unfollow";
        button.classList.add("filled");
    }

    var xhr = new XMLHttpRequest();
    xhr.open("POST", "/follow", true);
    xhr.setRequestHeader("Content-Type", "application/json");
    xhr.send(JSON.stringify({

        postid: post_id,
        followed: !currently_followed
    }));
}

function resize_textarea(textarea){

    textarea.style.height = '';
    textarea.style.height = textarea.scrollHeight + 'px';
}

function handle_postbox_key(textarea, e){

    if(e.which == 13){

        textarea.value += '\n';
    }
}

function handle_commentbox_key(textarea, e){

    if(e.which == 13 && e.shiftKey){

        textarea.value += '\n';

    }else if(e.which == 13 && !e.shiftKey){

        textarea.value = textarea.value.toString().replace(/\n/g, '<br/>');
        document.forms[0].submit();
        e.preventDefault();
    }
}

function format_editor_text(){

    var textarea = document.getElementById("draft-textarea");
    textarea.value = textarea.value.toString().replace(/\n/g, '<br/>');
}

function begin_user_edit(){

    var current_username = document.getElementById("user-username").innerHTML;
    document.getElementById("username-edit").value = current_username.substring(0, current_username.indexOf("<span"));
    document.getElementById("bio-edit").value = document.getElementById("user-bio").innerHTML;

    document.getElementById("username-edit").classList.remove("disabled");
    document.getElementById("bio-edit").classList.remove("disabled");
    document.getElementById("user-username").classList.add("disabled");
    document.getElementById("user-bio").classList.add("disabled");
}

function handle_user_edit_key(e){

    if(e.which == 13){

        var current_username_suffix = document.getElementById("user-username").innerHTML;
        current_username_suffix = current_username_suffix.substring(current_username_suffix.indexOf("<span"));
        document.getElementById("user-username").innerHTML = document.getElementById("username-edit").value + " " + current_username_suffix;
        document.getElementById("user-bio").innerHTML = document.getElementById("bio-edit").value;

        document.getElementById("username-edit").classList.add("disabled");
        document.getElementById("bio-edit").classList.add("disabled");
        document.getElementById("user-username").classList.remove("disabled");
        document.getElementById("user-bio").classList.remove("disabled");

        var xhr = new XMLHttpRequest();
        xhr.open("POST", "/edituser", true);
        xhr.setRequestHeader("Content-Type", "application/json");
        xhr.send(JSON.stringify({

            userid: Number(document.getElementById("userid").innerHTML),
            username: document.getElementById("username-edit").value,
            bio: document.getElementById("bio-edit").value
        }));
    }
}

function search_if_enter_pressed(textbox, e){

    if(e.which == 13){

        location.href = '/discover?searchtext=' + textbox.value;
    }
}
