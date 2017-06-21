import Bomberman from 'app/app';

firebase.auth().onAuthStateChanged(function(user) {
    let dialog = document.querySelector('#loginDialog');
    if (user) {
        // User is signed in.
        $("#loginCover").hide();
        if (dialog.open) {
            dialog.close();
        }

        //activate game
        new Bomberman();
    } else {
        // No user is signed in.
        $("#loginCover").show();
        dialog.showModal();
    }
});

let loginFunc = () => {
    let email = $("#loginEmail").val();
    let pwd = $("#loginPwd").val();

    if (email !== '' && pwd !== '') {
        $("#loginProgress").show();
        $("#loginBtn").hide();

        firebase.auth().signInWithEmailAndPassword(email, pwd).then((confirmationResult) => {
            $("#loginProgress").hide();
            $("#loginBtn").show();
        })
        .catch((error) => {
            $("#loginProgress").hide();
            $("#loginBtn").show();
            $("#loginError").show().text(error.message);
        });
    }
};

$('#loginBtn, .input_field').keypress(function (e) {
    if (e.which == 13) {
        loginFunc();
        e.preventDefault();
    }
});

$("#loginBtn").click(loginFunc);

$("#signOutBtn").click(() => {
    firebase.auth().signOut().then(() => {
        //sign-out successful
    }, (error) => {
        alert(error.message);
    });
});
