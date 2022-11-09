member_elem = (name) => `<div class="whitelist-member" data-member="${name}"><div class="whitelist-member-name">${name}</div><div class="delete-member" onclick="delete_member(this)">-</div></div>`

get_members = () => $('.whitelist-member-name').map((i, val) => val.textContent).toArray()

function dateToInputFormat(date) {
    year = new Intl.DateTimeFormat('en', { year: 'numeric' }).format(date)
    month = new Intl.DateTimeFormat('en', { month: '2-digit' }).format(date)
    day = new Intl.DateTimeFormat('en', { day: '2-digit' }).format(date)
    time = new Intl.DateTimeFormat('en', { hour: '2-digit', hour12: false, minute: '2-digit' }).format(date)
    str = `${year}-${month}-${day}T${time}`
    return str
}

function toUnixNano(date) {
    return date.getTime() * 1000000
}

$('document').ready(() => {
    refresh_counter()
    refresh_deadlines()
})

function delete_member(elem) {
    $(elem).parent().remove()
    refresh_counter()
}

function add_member() {
    value = $('#member-name').val().trim()
    if (value == '') {
        return
    }
    members = get_members()
    if (members.includes(value)) {
        $(`.whitelist-member[data-member="${value}"]`).animate({
            backgroundColor: 'rgba(255, 0, 0, 0.2)',
        }, 200).animate({
            backgroundColor: 'rgba(255, 0, 0, 0)',
        }, 1000)
        return
    }
    if (members.length >= 8) {
        $('#whitelist').animate({
            backgroundColor: "#ffcccc",
        }, 200).animate({
            backgroundColor: "#eeeeee",
        }, 1000)
        return
    }

    $('#whitelist').append(member_elem(value))
    $('#member-name').val('')
    refresh_counter()
}

function refresh_counter() {
    value = $('#threshold').val()
    max = get_members().length
    if (value == 0) {
        value++
        $('#threshold').val(1)
    }
    if (value > max) {
        $('#threshold').val(max)
    }
}

function refresh_deadlines() {
    curr_date = new Date()
    signup_value = $('#signup-deadline').val()
    voting_value = $('#voting-deadline').val()
    if (signup_value == "" || new Date(signup_value) < curr_date) {
        curr_date.setHours(curr_date.getHours() + 1)
        $('#signup-deadline').val(dateToInputFormat(curr_date))
        signup_value = $('#signup-deadline').val()
    }
    if (voting_value == "" || new Date(voting_value) < new Date(signup_value)) {
        signup_date = new Date(signup_value)
        signup_date.setHours(signup_date.getHours() + 1)
        $('#voting-deadline').val(dateToInputFormat(signup_date))
    }
}

function vote_created(result) {
    url = `${DOMAIN}/vote.html?id=${result}`
    proposal = $('#proposal').val()

    $('#proposal').val('')
    $('#whitelist').empty()
    refresh_deadlines()
    refresh_counter()
    $('#create-vote').prop('disabled', false).removeClass('loading')

    $('#created-vote-id').text(result)
    $('#created-vote-link a').attr('href', `vote.html?id=${result}`)
    $('#created-vote-link a').text(url)
    $('#created-link-share .tg-link').attr('href', `https://t.me/share/url?url=${url}&text=${'Vote for: ' + proposal}`)
    openPopup('creating-done')
}

$('#add-member').on('click', () => add_member())
$('#member-name').keyup((event) => {
    if (event.keyCode == 13) {
        event.preventDefault()
        add_member()
    }
})

$('#sign-up-deadline').on('change', () => refresh_deadlines())
$('#voting-deadline').on('change', () => refresh_deadlines())
$('#threshold').on('change', () => refresh_counter())

$('#create-vote').on('click', () => {
    if (!window.walletConnection.isSignedIn()) {
        $('#info-message').text('To create vote, you need to login').animate({
            opacity: 1,
        }, 200).animate({
            opacity: 0,
        }, 2000)
        return
    }

    options = {}

    options.proposal = $('#proposal').val().trim()
    if (options.proposal == '') {
        $('#proposal').animate({
            backgroundColor: "#ffcccc",
        }, 200).animate({
            backgroundColor: "#eeeeee",
        }, 1000)
        return
    }

    options.voters_whitelist = get_members()
    if (options.voters_whitelist.length == 0 || options.voters_whitelist.length > 8) {
        $('#whitelist').animate({
            backgroundColor: "#ffcccc",
        }, 200).animate({
            backgroundColor: "#eeeeee",
        }, 1000)
        return
    }

    options.threshold = parseInt($('#threshold').val())
    if (options.threshold == 0) {
        $('#threshold').animate({
            backgroundColor: "#ffcccc",
        }, 200).animate({
            backgroundColor: "#eeeeee",
        }, 1000)
        return
    }

    options.signup_deadline = toUnixNano(new Date($('#signup-deadline').val()))
    options.voting_deadline = toUnixNano(new Date($('#voting-deadline').val()))

    $('#create-vote').prop('disabled', true).addClass('loading')

    createVote(options).then((result) => {
        vote_created(result)
    }, (error) => {
        $('#info-message').text(error.message).animate({
            opacity: 1,
        }, 200).animate({
            opacity: 0,
        }, 2000)
        $('#create-vote').prop('disabled', false).removeClass('loading')
    })
})