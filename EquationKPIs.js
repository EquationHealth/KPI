Tickets = new Mongo.Collection('tickets');
Cards = new Mongo.Collection('cards');
Commits = new Mongo.Collection('commits');

/**
 * Client
 */
if (Meteor.isClient) {

    // This code only runs on the client
    angular.module('equationKPIs', ['angular-meteor']);

    angular.module('equationKPIs').controller('EquationKPICtrl', ['$scope',
        function ($scope) {

            /**
             * Subscribe
             */
            Meteor.subscribe('recent-ticket-stats');
            Meteor.subscribe('recent-commits');
            Meteor.subscribe('cards');

            /**
             * Helpers
             */
            $scope.helpers({
                ticketStats: () => {
                    return Tickets.find({}, {sort: {datetime: -1}, limit: 5}).fetch();
                },
                commitFeed: () => {
                    return Commits.find({}, {sort: {time: -1}, limit: 25}).fetch();
                },
                cards: () => {
                    return Cards.find({}, {sort: {number: -1}, limit: 25}).fetch();
                }
            });

            /**
             * Scope
             */
            Meteor.call('getStatusCount', function (err, res) {
                $scope.statusCount = res;
                $scope.apply();
            });
            Meteor.call('getOwnerCount', function (err, res) {
                $scope.ownerCount = res;
                $scope.apply();
            });
            Meteor.call('getYTDSprints', function (err, res) {
                $scope.sprintsYTD = res;
                $scope.apply();
            });
            Meteor.call('getYTDOwner', function (err, res) {
                $scope.ownerYTD = res;
                $scope.apply();
            });
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
    Meteor.publish('recent-ticket-stats', function publishFunction() {
        return Tickets.find({}, {sort: {datetime: -1}, limit: 5});
    });
    Meteor.publish('recent-commits', function publishFunction() {
        return Commits.find({}, {sort: {time: -1}, limit: 25});
    });
    Meteor.publish('cards', function publishFunction() {
        return Cards.find({}, {sort: {number: -1}, limit: 25});
    });


    /**
     * Startup
     */
    Meteor.startup(function () {
        if (Meteor.isServer) {
            Commits.remove({});
            Cards.remove({});
            Meteor.call('saveTickets');
            Meteor.call('saveCommits');
            Meteor.call('saveCards');
        }
    });

    //Meteor.setInterval(function(){
    //    Meteor.call('saveCards');
    //}, 5000);

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
        saveTickets: function () {
            var d = new Date(),
                zendeskCalls = ['zendesk_UnsolvedTickets', 'zendesk_OpenTickets', 'zendesk_NewTickets', 'zendesk_PendingTickets', 'zendesk_HoldTickets'],
                dataLabel = ['Total Tickets', 'Open Tickets', 'New Tickets', 'Pending Tickets', 'On-Hold Tickets'];
            for (var i = 0; i < zendeskCalls.length; i++) {
                Meteor.call(zendeskCalls[i], function (err, res) {
                    var json = JSON.parse(res);
                    var name = dataLabel[i];
                    var val = json.view_count.pretty;
                    Tickets.insert({
                        'name': name,
                        'value': val,
                        'datetime': d
                    });
                });
            }
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
                            time: json[i].revision_cache.time
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
                { "$group": {
                    "_id": {
                        "sprint": "$sprint",
                        "status": "$status"
                    },
                    "count": { "$sum": 1 }
                }},
                { "$group": {
                    "_id": "$_id.sprint",
                    "data": { "$push": {
                        "status": "$_id.status",
                        "count": "$count"
                    }}
                }}
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
        zendesk_UnsolvedTickets: function () {
            var zendesk = Async.runSync(function (done) {
                ZendeskOptions.url = ZendeskUrl + '32396347/count.json';
                request(ZendeskOptions, function (error, response, body) {
                    if (error) throw new Error(error);
                    done(null, body);
                });
            });
            return zendesk.result;
        },
        zendesk_OpenTickets: function () {
            var zendesk = Async.runSync(function (done) {
                ZendeskOptions.url = ZendeskUrl + '38506605/count.json';
                request(ZendeskOptions, function (error, response, body) {
                    if (error) throw new Error(error);
                    done(null, body);
                });
            });
            return zendesk.result;
        },
        zendesk_NewTickets: function () {
            var zendesk = Async.runSync(function (done) {
                ZendeskOptions.url = ZendeskUrl + '34858922/count.json';
                request(ZendeskOptions, function (error, response, body) {
                    if (error) throw new Error(error);
                    done(null, body);
                });
            });
            return zendesk.result;
        },
        zendesk_PendingTickets: function () {
            var zendesk = Async.runSync(function (done) {
                ZendeskOptions.url = ZendeskUrl + '38151799/count.json';
                request(ZendeskOptions, function (error, response, body) {
                    if (error) throw new Error(error);
                    done(null, body);
                });
            });
            return zendesk.result;
        },
        zendesk_HoldTickets: function () {
            var zendesk = Async.runSync(function (done) {
                ZendeskOptions.url = ZendeskUrl + '49913396/count.json';
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
