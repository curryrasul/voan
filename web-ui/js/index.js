member_elem = (name) => `<div class="whitelist-member" data-member="${name}"><div class="whitelist-member-name">${name}</div><div class="delete-member" onclick="delete_member(this)">-</div></div>`

get_members = () => $('.whitelist-member-name').map((i, val) => val.textContent).toArray()

const inputDateFormat = 'YYYY-MM-DDTHH:mm'

$('document').ready(() => {
    refresh_counter()
    refresh_deadlines()
})

$('#get-vote').on('click', () => {
    window.location.replace(`vote.html?id=${$('#vote-id').val()}`)
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
    curr_date = moment()
    curr_date.seconds(0)
    signup_date = moment($('#signup-deadline').val())
    voting_date = moment($('#voting-deadline').val())
    if (!signup_date._isValid || signup_date.isBefore(curr_date)) {
        signup_date = curr_date
        signup_date.add(1, 'h')
        $('#signup-deadline').val(signup_date.format(inputDateFormat))
    }
    if (!voting_date._isValid || voting_date.isBefore(signup_date)) {
        voting_date = signup_date
        voting_date.add(1, 'h')
        $('#voting-deadline').val(voting_date.format(inputDateFormat))
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

$('#signup-deadline').on('change', () => refresh_deadlines())
$('#voting-deadline').on('change', () => refresh_deadlines())
$('#threshold').on('change', () => refresh_counter())

$('#create-vote').on('click', () => {
    $('#create-vote').prop('disabled', true).addClass('loading')

    if (!window.walletConnection.isSignedIn()) {
        $('#info-message').text('To create vote, you need to login').animate({
            opacity: 1,
        }, 200).animate({
            opacity: 0,
        }, 2000)
        $('#create-vote').prop('disabled', false).removeClass('loading')
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
        $('#create-vote').prop('disabled', false).removeClass('loading')
        return
    }

    options.voters_whitelist = get_members()
    if (options.voters_whitelist.length == 0 || options.voters_whitelist.length > 8) {
        $('#whitelist').animate({
            backgroundColor: "#ffcccc",
        }, 200).animate({
            backgroundColor: "#eeeeee",
        }, 1000)
        $('#create-vote').prop('disabled', false).removeClass('loading')
        return
    }

    options.threshold = parseInt($('#threshold').val())
    if (options.threshold == 0) {
        $('#threshold').animate({
            backgroundColor: "#ffcccc",
        }, 200).animate({
            backgroundColor: "#eeeeee",
        }, 1000)
        $('#create-vote').prop('disabled', false).removeClass('loading')
        return
    }

    signup_deadline = moment($('#signup-deadline').val())
    if (!signup_deadline._isValid) {
        $('#signup-deadline').animate({
            backgroundColor: "#ffcccc",
        }, 200).animate({
            backgroundColor: "#eeeeee",
        }, 1000)
        $('#create-vote').prop('disabled', false).removeClass('loading')
        return
    }
    options.signup_deadline = signup_deadline.unix() * 1000000000

    voting_deadline = moment($('#voting-deadline').val())
    if (!voting_deadline._isValid) {
        $('#voting-deadline').animate({
            backgroundColor: "#ffcccc",
        }, 200).animate({
            backgroundColor: "#eeeeee",
        }, 1000)
        $('#create-vote').prop('disabled', false).removeClass('loading')
        return
    }
    options.voting_deadline = voting_deadline.unix() * 1000000000

    new_voting(options).then((result) => {
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