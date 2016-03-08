ticketStats = new Mongo.Collection('ticketStats');
ticketFeed = new Mongo.Collection('ticketFeed');
Cards = new Mongo.Collection('cards');
Commits = new Mongo.Collection('commits');

/**
 * Client
 */
if (Meteor.isClient) {

    // This code only runs on the client
    angular.module('equationKPIs', ['angular-meteor','googlechart']);

    angular.module('equationKPIs').controller('EquationKPICtrl', ['$scope',
        function ($scope) {

            /**
             * Meta
             */

            /**
             * Subscribe
             */
            Meteor.subscribe('recent-commits');
            Meteor.subscribe('cards');
            Meteor.subscribe('ticket-feed');

            /**
             * Helpers
             */
            $scope.helpers({
                commitFeed: () => {
                    return Commits.find({}, {sort: {time: -1}, limit: 10}).fetch();
                },
                cards: () => {
                    return Cards.find({}, {sort: {sprint: -1, number: -1}, limit: 14}).fetch();
                },
                ticketFeed: () => {
                    return ticketFeed.find({}, {sort: {updated: -1}, limit: 10}).fetch();
                }
            });

            /**
             * Scope
             */

            Meteor.call('getLatestTicketStats', function (err, res) {
                console.log(res);
                for (var i = 0; i < res.length; i++) {
                    $scope.stats_unsolvedTickets = res[i].unsolvedTickets;
                    $scope.stats_openTickets = res[i].openTickets;
                    $scope.stats_newTickets = res[i].newTickets;
                    $scope.stats_pendingTickets = res[i].pendingTickets;
                    $scope.stats_onholdTickets = res[i].onholdTickets;
                    $scope.stats_solvedTickets7Days = res[i].solvedTickets7Days;
                    $scope.stats_solvedTickets30Days = res[i].solvedTickets30Days;
                    $scope.stats_newTickets30Days = res[i].newTickets30Days;
                    $scope.stats_newTickets7Days = res[i].newTickets7Days;
                    $scope.$apply();
                }
            });

            Meteor.call('getTicketType', function (err, res) {
                $scope.ticketTypes = res;
                $scope.chartTicketTypes = {};
                $scope.chartTicketTypes.type = "ColumnChart";
                var chartCols = [
                    {label: 'Type', type: 'string'},
                    {label: 'Tickets', type: 'number'}
                ];
                var chartData = [];
                for (var i = 0; i < res.length; i++) {
                    if(res[i].type != null) {
                        chartData.push({
                            c: [
                                {v: res[i].type},
                                {v: res[i].count}
                            ]
                        });
                    }
                }
                $scope.chartTicketTypes.data = {'cols': chartCols, 'rows': chartData};
                $scope.chartTicketTypes.options = {
                    colors: ['#04667a'],
                    legend: 'none'
                };
                $scope.$apply();
            });

            Meteor.call('getTicketDayOfWeek', function (err, res) {
                $scope.ticketDayOfWeek = res;
                $scope.chartTicketDayOfWeek = {};
                $scope.chartTicketDayOfWeek.type = "ColumnChart";
                var chartCols = [
                    {label: 'Day of Week', type: 'string'},
                    {label: 'Tickets', type: 'number'}
                ];
                var chartData = [];
                for (var key in res[0]) {
                    chartData.push({
                        c: [
                            {v: key},
                            {v: res[0][key]}
                        ]
                    });
                }
                $scope.chartTicketDayOfWeek.data = {'cols': chartCols, 'rows': chartData};
                $scope.chartTicketDayOfWeek.options = {
                    colors: ['#04667a'],
                    legend: 'none'
                };
                $scope.$apply();
            });

            //Meteor.call('getTicketTrend', function (err, res) {
            //    var recentTickets = res;
            //    $scope.chartTicketTrend = {};
            //    $scope.chartTicketTrend.type = "ColumnChart";
            //    var chartCols = [
            //        {label: 'Day', type: 'string'},
            //        {label: 'Tickets', type: 'number'}
            //    ];
            //    var chartData = [];
            //    for (var i = 0; i < recentTickets.length; i++) {
            //        var m = new Date().getMonth();
            //        var d = monthNameShort[m] + ' ' + recentTickets[i].day;
            //        chartData.push({
            //            c: [
            //                {v: d},
            //                {v: recentTickets[i].count}
            //            ]
            //        });
            //    }
            //    $scope.chartTicketTrend.data = {'cols': chartCols, 'rows': chartData};
            //    $scope.chartTicketTrend.options = {
            //        colors: ['#04667a'],
            //        legend: 'none',
            //        vAxis: {
            //            baselineColor: '#fff',
            //            gridlineColor: '#fff',
            //            textColor: '#777',
            //            textStyle: {
            //                fontSize: 11
            //            }
            //        },
            //        hAxis: {
            //            textColor: '#777',
            //            textStyle: {
            //                fontSize: 11
            //            }
            //        }
            //    };
            //    $scope.$apply()
            //});
            Meteor.call('getCommitTrend', function (err, res) {
                var recentCommits = res;
                $scope.chartCommitTrend = {};
                $scope.chartCommitTrend.type = "ColumnChart";
                var chartCols = [
                    {label: 'Day', type: 'string'},
                    {label: 'Commits', type: 'number'}
                ];
                var chartData = [];
                var getDateFromDayNum = function(dayNum, year){
                    var monthNameShort = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                    var date = new Date();
                    if(year){
                        date.setFullYear(year);
                    }
                    date.setMonth(0);
                    date.setDate(0);
                    var timeOfFirst = date.getTime();
                    var dayMilli = 1000 * 60 * 60 * 24;
                    var dayNumMilli = dayNum * dayMilli;
                    date.setTime(timeOfFirst + dayNumMilli);
                    return monthNameShort[date.getMonth()] + ' ' + date.getDate();
                };
                for (var i = 0; i < recentCommits.length; i++) {
                    var d = getDateFromDayNum(recentCommits[i].day);
                    chartData.push({
                        c: [
                            {v: d},
                            {v: recentCommits[i].count}
                        ]
                    });
                }
                $scope.chartCommitTrend.data = {'cols': chartCols, 'rows': chartData};
                $scope.chartCommitTrend.options = {
                    colors: ['#04667a'],
                    legend: 'none',
                    vAxis: {
                        baselineColor: '#fff',
                        gridlineColor: '#fff',
                        textColor: '#777',
                        textStyle: {
                            fontSize: 11
                        }
                    },
                    hAxis: {
                        textColor: '#777',
                        textStyle: {
                            fontSize: 11
                        }
                    }
                };
                $scope.$apply()
            });
            Meteor.call('getStatusCount', function (err, res) {
                $scope.statusCount = res;
                var c = 0;
                var t = 0;
                for (var i = 0; i < res.length; i++) {
                    if(res[i].status == 'Done' || res[i].status == 'Ready for Live' || res[i].status == 'Stage') {
                        c += res[i].count;
                    }
                    t += res[i].count;
                }
                $scope.sprintComplete = (c / t * 100).toFixed(0);
                $scope.$apply();
            });
            Meteor.call('getOwnerCount', function (err, res) {
                $scope.ownerCount = res;
                $scope.$apply();
            });
            Meteor.call('getYTDSprints', function (err, res) {
                $scope.sprintsYTD = res;
                $scope.chartYTDSprints = {};
                $scope.chartYTDSprints.type = "ColumnChart";
                var chartCols = [
                    {label: 'Sprint', type: 'string'},
                    {label: 'Cards', type: 'number'}
                ];
                var chartData = [];
                for (var i = 0; i < res.length; i++) {
                    chartData.push({
                        c: [
                            {v: res[i].sprint},
                            {v: res[i].count}
                        ]
                    });
                }
                $scope.chartYTDSprints.data = {'cols': chartCols, 'rows': chartData};
                $scope.chartYTDSprints.options = {
                    //'title': ''
                    colors: ['#04667a'],
                    legend: 'none'
                };
                $scope.$apply();
            });
            Meteor.call('getYTDOwner', function (err, res) {
                $scope.ownerYTD = res;
                $scope.chartYTDOwners = {};
                $scope.chartYTDOwners.type = "ColumnChart";
                var chartCols = [
                    {label: 'Owner', type: 'string'},
                    {label: 'Cards', type: 'number'}
                ];
                var chartData = [];
                for (var i = 0; i < res.length; i++) {
                    chartData.push({
                        c: [
                            {v: res[i].owner},
                            {v: res[i].count}
                        ]
                    });
                }
                $scope.chartYTDOwners.data = {'cols': chartCols, 'rows': chartData};
                $scope.chartYTDOwners.options = {
                    //'title': ''
                    colors: ['#04667a'],
                    legend: 'none'
                };
                $scope.$apply();
            });

            /**
             * Intervals
             */
            Meteor.setInterval(function () {
                Meteor.call('getCommitTrend', function (err, res) {
                    var recentCommits = res;
                    $scope.chartCommitTrend = {};
                    $scope.chartCommitTrend.type = "ChartChart";
                    var chartCols = [
                        {label: 'Day', type: 'string'},
                        {label: 'Commits', type: 'number'}
                    ];
                    var chartData = [];
                    var getDateFromDayNum = function(dayNum, year){
                        var monthNameShort = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                        var date = new Date();
                        if(year){
                            date.setFullYear(year);
                        }
                        date.setMonth(0);
                        date.setDate(0);
                        var timeOfFirst = date.getTime();
                        var dayMilli = 1000 * 60 * 60 * 24;
                        var dayNumMilli = dayNum * dayMilli;
                        date.setTime(timeOfFirst + dayNumMilli);
                        return monthNameShort[date.getMonth()] + ' ' + date.getDate();
                    };
                    for (var i = 0; i < recentCommits.length; i++) {
                        var d = getDateFromDayNum(recentCommits[i].day);
                        chartData.push({
                            c: [
                                {v: d},
                                {v: recentCommits[i].count}
                            ]
                        });
                    }
                    $scope.chartCommitTrend.data = {'cols': chartCols, 'rows': chartData};
                    $scope.chartCommitTrend.options = {
                        colors: ['#04667a'],
                        legend: 'none',
                        vAxis: {
                            baselineColor: '#fff',
                            gridlineColor: '#fff',
                            textColor: '#777',
                            textStyle: {
                                fontSize: 11
                            }
                        },
                        hAxis: {
                            textColor: '#777',
                            textStyle: {
                                fontSize: 11
                            }
                        }
                    };
                    $scope.$apply()
                });
                Meteor.call('getStatusCount', function (err, res) {
                    $scope.statusCount = res;
                    $scope.$apply();
                });
                Meteor.call('getOwnerCount', function (err, res) {
                    $scope.ownerCount = res;
                    $scope.$apply();
                });
                Meteor.call('getYTDSprints', function (err, res) {
                    $scope.sprintsYTD = res;
                    $scope.chartYTDSprints = {};
                    $scope.chartYTDSprints.type = "ColumnChart";
                    var chartCols = [
                        {label: 'Sprint', type: 'string'},
                        {label: 'Cards', type: 'number'}
                    ];
                    var chartData = [];
                    for (var i = 0; i < res.length; i++) {
                        chartData.push({
                            c: [
                                {v: res[i].sprint},
                                {v: res[i].count}
                            ]
                        });
                    }
                    $scope.chartYTDSprints.data = {'cols': chartCols, 'rows': chartData};
                    $scope.chartYTDSprints.options = {
                        //'title': ''
                        colors: ['#04667a'],
                        legend: 'none'
                    };
                    $scope.$apply();
                });
                Meteor.call('getYTDOwner', function (err, res) {
                    $scope.ownerYTD = res;
                    $scope.chartYTDOwners = {};
                    $scope.chartYTDOwners.type = "ColumnChart";
                    var chartCols = [
                        {label: 'Owner', type: 'string'},
                        {label: 'Cards', type: 'number'}
                    ];
                    var chartData = [];
                    for (var i = 0; i < res.length; i++) {
                        chartData.push({
                            c: [
                                {v: res[i].owner},
                                {v: res[i].count}
                            ]
                        });
                    }
                    $scope.chartYTDOwners.data = {'cols': chartCols, 'rows': chartData};
                    $scope.chartYTDOwners.options = {
                        //'title': ''
                        colors: ['#04667a'],
                        legend: 'none'
                    };
                    $scope.$apply();
                });
            }, 10000);
        }
    ]);
}

/**
 * Server
 */
if (Meteor.isServer) {

    /**
     * NPM Modules
     */
    var request = Meteor.npmRequire('request');

    /**
     * Publish
     */
    Meteor.publish('recent-commits', function publishFunction() {
        return Commits.find({}, {sort: {time: -1}, limit: 10});
    });
    Meteor.publish('cards', function publishFunction() {
        return Cards.find({}, {limit: 50});
    });
    Meteor.publish('ticket-feed', function publishFunction() {
        return ticketFeed.find({}, {sort: {updated: -1}, limit: 10});
    });


    /**
     * Startup
     */
    Meteor.startup(function () {
        if (Meteor.isServer) {
            Meteor.call('saveTicketStats');
            Meteor.call('saveTicketFeed');
            Meteor.call('saveCommits');
            Meteor.call('saveCards');
        }
    });

    Meteor.setInterval(function(){
        Meteor.call('saveTicketStats');
        Meteor.call('saveTicketFeed');
    }, 3600000);

    Meteor.setInterval(function(){
        Meteor.call('saveCommits');
        Meteor.call('saveCards');
    }, 10000);

    /**
     * Zendesk
     * @type {string}
     */
    var ZendeskUsername = Meteor.settings.ZendeskUsername,
        ZendeskPassword = Meteor.settings.ZendeskPassword,
        ZendeskUrl = Meteor.settings.ZendeskUrl,
        ZendeskAuth = 'Basic ' + new Buffer(ZendeskUsername + ':' + ZendeskPassword).toString('base64');

    var ZendeskOptions = {
        method: 'GET',
        url: ZendeskUrl,
        headers: {
            'Authorization': ZendeskAuth
        }
    };

    /**
     * Mingle
     * @type {string}
     */
    var MingleUsername = Meteor.settings.MingleUsername,
        MinglePassword = Meteor.settings.MinglePassword,
        MingleUrl = Meteor.settings.MingleUrl,
        MingleAuth = 'Basic ' + new Buffer(MingleUsername + ':' + MinglePassword).toString('base64'),
        MingleActiveSprint = '529',
        MingleStartSprint = '529';

    var MingleOptions = {
        method: 'GET',
        url: MingleUrl,
        headers: {
            'Authorization': MingleAuth
        }
    };

    /**
     * Beanstalk
     * @type {string}
     */
    var BeanstalkUsername = Meteor.settings.BeanstalkUsername,
        BeanstalkPassword = Meteor.settings.BeanstalkPassword,
        BeanstalkAuth = 'Basic ' + new Buffer(BeanstalkUsername + ':' + BeanstalkPassword).toString('base64');

    var BeanstalkOptions = {
        method: 'GET',
        headers: {
            'Authorization': BeanstalkAuth
        }
    };

    /**
     * Methods
     */
    Meteor.methods({
        saveTicketFeed: function () {
            Meteor.call('getTicketFeed', function (err, res) {
                var json = JSON.parse(res);
                for (var i = 0; i < json.tickets.length; i++) {
                    ticketFeed.upsert({
                        id: json.tickets[i].id
                    }, {
                        $set: {
                            name: json.tickets[i].subject,
                            type: json.tickets[i].type,
                            status: json.tickets[i].status,
                            priority: json.tickets[i].priority,
                            created: new Date(json.tickets[i].created_at),
                            updated: new Date(json.tickets[i].updated_at)
                        }
                    }, [{multi: true}]);
                }
            });
        },
        getLatestTicketStats: function () {
          return ticketStats.find({}, {sort: {date: -1}, limit: 1}).fetch();
        },
        saveTicketStats: function () {
            Meteor.call('getTicketStats', function (err, res) {
                var json = JSON.parse(res);
                var unsolvedTickets = 0,
                    openTickets = 0,
                    newTickets = 0,
                    pendingTickets = 0,
                    onholdTickets = 0,
                    solvedTickets7Days = 0,
                    solvedTickets30Days = 0,
                    newTickets30Days = 0,
                    newTickets7Days = 0;
                for (var i = 0; i < json.view_counts.length; i++) {
                    var id = json.view_counts[i].view_id;
                    if(id == '32396347') {
                        unsolvedTickets = json.view_counts[i].pretty;
                    }
                    if(id == '38506605') {
                        openTickets = json.view_counts[i].pretty;
                    }
                    if(id == '34858922') {
                        newTickets = json.view_counts[i].pretty;
                    }
                    if(id == '38151799') {
                        pendingTickets = json.view_counts[i].pretty;
                    }
                    if(id == '49913396') {
                        onholdTickets = json.view_counts[i].pretty;
                    }
                    if(id == '48754163') {
                        solvedTickets7Days = json.view_counts[i].pretty;
                    }
                    if(id == '48754173') {
                        solvedTickets30Days = json.view_counts[i].pretty;
                    }
                    if(id == '50029956') {
                        newTickets30Days = json.view_counts[i].pretty;
                    }
                    if(id == '48754243') {
                        newTickets7Days = json.view_counts[i].pretty;
                    }
                }
                ticketStats.insert({
                    unsolvedTickets: unsolvedTickets.replace('~',''),
                    openTickets: openTickets.replace('~',''),
                    newTickets: newTickets.replace('~',''),
                    pendingTickets: pendingTickets.replace('~',''),
                    onholdTickets: onholdTickets.replace('~',''),
                    solvedTickets7Days: solvedTickets7Days.replace('~',''),
                    solvedTickets30Days: solvedTickets30Days.replace('~',''),
                    newTickets30Days: newTickets30Days.replace('~',''),
                    newTickets7Days: newTickets7Days.replace('~',''),
                    date: new Date()
                });
            });
        },
        saveCommits: function () {
            Meteor.call('beanstalk_CommitFeed', function (err, res) {
                var json = JSON.parse(res);
                for (var i = 0; i < json.length; i++) {
                    var revisionNumber = json[i].revision_cache.revision;
                    Commits.upsert({
                        revision: revisionNumber
                    }, {
                        $set: {
                            message: json[i].revision_cache.message,
                            author: json[i].revision_cache.author,
                            time: new Date(json[i].revision_cache.time)
                        }
                    });
                }
            });
        },
        saveCards: function () {
            Meteor.call('mingle_getCards', function (err, res) {
                var json = JSON.parse(res);
                for (var i = 0; i < json.length; i++) {
                    var cardNumber = json[i]['Number'];
                    Cards.upsert({
                        number: cardNumber
                    }, {
                        $set: {
                            sprint: json[i].Sprint,
                            status: json[i].Status,
                            name: json[i].Name,
                            owner: json[i].Owner
                        }
                    }, [{multi: true}]);
                }
            });
        },
        getStatusCount: function() {
            var pipeline = [
                {$sort: {sprint: -1}},
                {
                    "$group": {
                        "_id": {
                            "sprint": "$sprint",
                            "status": "$status"
                        },
                        "count": {"$sum": 1}
                    }
                },
                {
                    "$group": {
                        "_id": "$_id.sprint",
                        "data": {
                            "$push": {
                                "status": "$_id.status",
                                "count": "$count"
                            }
                        }
                    }
                },
                {'$sort': {'_id': -1}}
            ];
            var res = Cards.aggregate(pipeline);
            var data = [];
            for(var i = 0; i <  res[0].data.length; i++) {
                var d = new Date();
                data.push({
                    'status': res[0].data[i].status,
                    'count': res[0].data[i].count,
                    'datetime': d
                });
            }
            return data;
        },
        getOwnerCount: function() {
            var currentSprint = Cards.find({}, {sort: {sprint: -1}, limit: 1}).fetch();
            currentSprint = currentSprint[0].sprint;
            pipeline = [
                {
                    '$match': {
                        'sprint': currentSprint,
                        'status': { $in: ['Stage','Ready for Live','Done'] }
                    }
                },
                { "$group": {
                    "_id": {
                        "owner": "$owner",
                        "status": "$status"
                    },
                    "count": { "$sum": 1 }
                }},
                { "$group": {
                    "_id": "$_id.owner",
                    "data": { "$push": {
                        "name": "$_id.owner",
                        "count": "$count"
                    }}
                }}
            ];
            var res = Cards.aggregate(pipeline);
            var data = [];
            for(var i = 0; i < res.length; i++) {
                var d = new Date();
                data.push({
                    'owner': res[i].data[0].name,
                    'count': res[i].data[0].count,
                    'datetime': d
                });
            }
            return data;
        },
        getYTDOwner: function() {
            pipeline = [
                {
                    '$match': {
                        'status': { $in: ['Stage','Ready for Live','Done'] }
                    }
                },
                { "$group": {
                    "_id": {
                        "owner": "$owner",
                    },
                    "count": { "$sum": 1 }
                }}
            ];
            var res = Cards.aggregate(pipeline);
            var data = [];
            for(var i = 0; i < res.length; i++) {
                var d = new Date();
                data.push({
                    'owner': res[i]['_id'].owner,
                    'count': res[i].count,
                    'datetime': d
                });
            }
            return data;
        },
        getYTDSprints: function() {
            pipeline = [
                {$sort: {sprint: -1}},
                {
                    '$match': {
                        'status': { $in: ['Stage','Ready for Live','Done'] }
                    }
                },
                { "$group": {
                    "_id": {
                        "sprint": "$sprint"
                    },
                    "count": { "$sum": 1 }
                }}
            ];
            var res = Cards.aggregate(pipeline);
            var data = [];
            for(var i = 0; i < res.length; i++) {
                var d = new Date();
                data.push({
                    'sprint': res[i]['_id'].sprint,
                    'count': res[i].count,
                    'datetime': d
                });
            }
            return data;
        },
        getTicketType: function() {
            pipeline = [
                { "$group": {
                    "_id": {
                        type: "$type"
                    },
                    "count": { "$sum": 1 }
                }}
            ];
            var res = ticketFeed.aggregate(pipeline);
            var data = [];
            for(var i = 0; i < res.length; i++) {
                data.push({
                    'type': res[i]['_id'].type,
                    'count': res[i].count
                });
            }
            return data;
        },
        getTicketDayOfWeek: function() {
            var dayOfWeek = [
                'null',
                'Sun',
                'Mon',
                'Tues',
                'Wed',
                'Thur',
                'Fri',
                'Sat'
            ];
            pipeline = [
                {$project : {
                    day : {$dayOfWeek : "$created"}
                }},
                { "$group": {
                    "_id": {
                        day: "$day"
                    },
                    "count": { "$sum": 1 }
                }}
            ];
            var res = ticketFeed.aggregate(pipeline);
            var days = {
                'Mon': 0,
                'Tues': 0,
                'Wed': 0,
                'Thur': 0,
                'Fri': 0
            };
            for (var i = 0; i < res.length; i++) {
                var day = dayOfWeek[res[i]['_id'].day];
                days[day] += res[i].count;
            }
            var data = [];
            data.push(days);
            return data;
        },
        getTicketTrend: function() {
            pipeline = [
                {$project : {
                    day : {$dayOfYear : "$created"}
                }},
                { "$group": {
                    "_id": {
                        day: "$day"
                    },
                    "count": { "$sum": 1 }
                }},
                {$sort: {day: -1}}
            ];
            var res = ticketFeed.aggregate(pipeline);
            var t = new Date();
            var s = new Date(t.getFullYear(), 0, 1);
            var o = 1000 * 60 * 60 * 24;
            var c = Math.ceil((t.getTime() - s.getTime()) / (o));
            var data = [];
            for (var i = 0; i < res.length; i++) {
                if(res[i]['_id'].day <= c) {
                    data.push({
                        'day': res[i]['_id'].day,
                        'count': res[i].count
                    });
                }
            }
            for (var i = 0; i <= c; i++) {
                if(!("key" in data)) {

                }
                if(res[i]['_id'].day <= c) {
                    data.push({
                        'day': res[i]['_id'].day,
                        'count': res[i].count
                    });
                }
            }
            return data;
        },
        getCommitTrend: function() {
            pipeline = [
                {$project : {
                    day : {$dayOfYear : "$time"}
                }},
                { "$group": {
                    "_id": {
                        day: "$day"
                    },
                    "count": { "$sum": 1 }
                }},
                {'$sort': {'_id.day': 1}},
                { $limit : 15 }
            ];
            var res = Commits.aggregate(pipeline);
            var data = [];
            for(var i = 0; i < res.length; i++) {
                data.push({
                    'day': res[i]['_id'].day,
                    'count': res[i].count
                });
            }
            return data;
        },
        getTicketStats: function () {
            var zendesk = Async.runSync(function (done) {
                var viewObj = '32396347,38506605,34858922,38151799,49913396,48754163,48754173,50029956,48754243';
                ZendeskOptions.url = ZendeskUrl + 'count_many.json?ids=' + viewObj + '';
                request(ZendeskOptions, function (error, response, body) {
                    if (error) throw new Error(error);
                    done(null, body);
                });
            });
            return zendesk.result;
        },
        getTicketFeed: function () {
            var zendesk = Async.runSync(function (done) {
                ZendeskOptions.url = ZendeskUrl + '32396347/tickets.json';
                request(ZendeskOptions, function (error, response, body) {
                    if (error) throw new Error(error);
                    done(null, body);
                });
            });
            return zendesk.result;
        },
        mingle_getCards: function() {
            var mingle = Async.runSync(function (done) {
               var query = 'select number, sprint, status, name, owner where type=story and sprint >= number 529';
                MingleOptions.qs = {
                    'mql': query
                };
                request(MingleOptions, function (error, response, body) {
                    if (error) throw new Error(error);
                    done(null, body);
                });
            });
            return mingle.result;
        },
        mingle_SprintStatus: function () {
            var mingle = Async.runSync(function (done) {
                var MingleQuery = 'SELECT status, count(*) WHERE Type=Story and Sprint=NUMBER ' + MingleActiveSprint + ' group by status';
                MingleOptions.qs = {
                    'mql': MingleQuery
                };
                request(MingleOptions, function (error, response, body) {
                    if (error) throw new Error(error);
                    done(null, body);
                });
            });
            return mingle.result;
        },
        mingle_SprintOwnerCompletion: function () {
            var mingle = Async.runSync(function (done) {
                MingleQuery = 'SELECT Owner, Count(*) WHERE Type=Story and Sprint=NUMBER ' + MingleActiveSprint + ' and (Status=Done or Status=Stage or Status="Ready for Live")';
                MingleOptions.qs = {
                    'mql': MingleQuery
                };
                request(MingleOptions, function (error, response, body) {
                    if (error) throw new Error(error);
                    done(null, body);
                });
            });
            return mingle.result;
        },
        mingle_YTDOwnerCompletion: function () {
            var mingle = Async.runSync(function (done) {
                MingleQuery = 'select owner, count(*) where sprint >= number ' + MingleStartSprint + ' and (Status=Done or Status=Stage or Status="Ready for Live") group by owner';
                MingleOptions.qs = {
                    'mql': MingleQuery
                };
                request(MingleOptions, function (error, response, body) {
                    if (error) throw new Error(error);
                    done(null, body);
                });
            });
            return mingle.result;
        },
        mingle_YTDSprintCompletion: function () {
            var mingle = Async.runSync(function (done) {
                MingleQuery = 'select sprint, count(*) where sprint >= number ' + MingleStartSprint + ' and (Status=Done or Status=Stage or Status="Ready for Live") group by sprint';
                MingleOptions.qs = {
                    'mql': MingleQuery
                };
                request(MingleOptions, function (error, response, body) {
                    if (error) throw new Error(error);
                    done(null, body);
                });
            });
            return mingle.result;
        },
        beanstalk_CommitFeed: function () {
            var beanstalk = Async.runSync(function (done) {
                BeanstalkOptions.url = 'https://eqc.beanstalkapp.com/api/changesets/repository.json?repository_id=datariver';
                request(BeanstalkOptions, function (error, response, body) {
                    if (error) throw new Error(error);
                    done(null, body);
                });
            });
            return beanstalk.result;
        }
    });
}
