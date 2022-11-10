waiting_member_elem = (name) => `<div class="waiting-member">${name}</div>`

$('document').ready(() => {
    params = parseGetParams()
    id = + params.id
    if (!id) {
        $('#placeholder').css('display', 'none')
        $('#wrong-vote').css('display', 'block').animate({
            opacity: 1
        }, 200)
        return
    }

    get_vote_data(id).then((options) => {
        $('#vote-card-id').text(`VOTE #${id}`)
        $('#vote-card-proposal').text(options.proposal)
        $('#yes').text(options.yes_count)
        $('#no').text(options.vote_count - options.yes_count)

        let status
        curr_date = moment()
        signup_date = moment.unix(options.signup_deadline / 1000000000)
        voting_date = moment.unix(options.voting_deadline / 1000000000)
        if (curr_date.isBefore(signup_date) && options.curr_list.length > 0) {
            status = 0
        } else if (curr_date.isBefore(voting_date) && options.yes_count < options.threshold) {
            status = 1
        } else {
            status = 2
        }

        switch (status) {
            case 0:
                $('#vote-card-phase').text('REGISTRATION')
                startTimer(signup_date)

                $('#waiting-list').empty()
                options.curr_list.forEach((e) => {
                    $('#waiting-list').append(waiting_member_elem(e))
                })
                $('#vote-card-side').css('display', 'flex')

                if (options.curr_list.includes(window.window.walletConnection.account().accountId)) {
                    $('#vote-registration').css('display', 'block')
                }
                break
            case 1:
                $('#vote-card-phase').text('REGISTRATION')
                startTimer(voting_date)
                break
            case 2:
                $('#vote-card-phase').text('ENDED')
                $('#vote-card-deadline').text('')
                break
        }

        $('#placeholder').css('display', 'none')
        $('#vote-card').css('display', 'flex').animate({
            opacity: 1
        }, 200)
        return
    }, (error) => {
        $('#placeholder').css('display', 'none')
        $('#wrong-vote').css('display', 'block').animate({
            opacity: 1
        }, 200)
        return
    })
})

function startTimer(date) {
    add_zeros = (number) => ('0' + number).slice(-2)
    count_down_tick = () => {
        duration = moment.duration(date.diff(moment()))
        $('#vote-card-deadline').text(`${add_zeros(Math.floor(duration.asHours()))}:${add_zeros(duration.minutes())}:${add_zeros(duration.seconds())}`)
    }
    count_down_tick()
    setInterval(count_down_tick, 1000)
}

function parseGetParams() {
    var params = {}
    window.location.search.substring(1).split('&').forEach((elem) => {
        params[elem.split('=')[0]] = elem.split('=')[1]
    })
    return params
}