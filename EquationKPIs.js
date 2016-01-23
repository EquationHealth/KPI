Tickets = new Mongo.Collection('tickets');
Sprints = new Mongo.Collection('sprints');
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
             * Subscriptions
             */
            Meteor.subscribe('recent-ticket-stats');
            Meteor.subscribe('recent-commits');

            /**
             * Helpers
             */
            $scope.helpers({
                ticketStats: () => {
                    return Tickets.find({}, {sort: {datetime: -1}, limit: 5}).fetch();
                },
                commitFeed: () => {
                    return Commits.find({}, {sort: {time: -1}, limit: 25}).fetch();
                }
            });


            /**
             * Mingle
             */

            $scope.sprints = [];
            $scope.sprintOwners = [];
            $scope.sprintsYTD = [];
            $scope.sprintOwnersYTD = [];

            Meteor.call("mingle_SprintStatus", function (error, results) {
                var json = JSON.parse(results);
                for (var i = 0; i < json.length; i++) {
                    $scope.sprints.push({
                        'status': json[i].Status,
                        'count': json[i]['Count ']
                    });
                    $scope.$apply();
                }
            });

            Meteor.call("mingle_SprintOwnerCompletion", function (error, results) {
                var json = JSON.parse(results);
                for (var i = 0; i < json.length; i++) {
                    $scope.sprintOwners.push({
                        'owner': json[i].Owner,
                        'count': json[i]['Count ']
                    });
                    $scope.$apply();
                }
            });

            Meteor.call("mingle_YTDOwnerCompletion", function (error, results) {
                var json = JSON.parse(results);
                for (var i = 0; i < json.length; i++) {
                    $scope.sprintOwnersYTD.push({
                        'owner': json[i].Owner,
                        'count': json[i]['Count ']
                    });
                    $scope.$apply();
                }
            });

            Meteor.call("mingle_YTDSprintCompletion", function (error, results) {
                var json = JSON.parse(results);
                for (var i = 0; i < json.length; i++) {
                    $scope.sprintsYTD.push({
                        'sprint': json[i].Sprint,
                        'count': json[i]['Count ']
                    });
                    $scope.$apply();
                }
            });

        }]);
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
     * Publishing
     */
    Meteor.publish('recent-ticket-stats', function publishFunction() {
        return Tickets.find({}, {sort: {datetime: -1}, limit: 5});
    });
    Meteor.publish('recent-commits', function publishFunction() {
        return Commits.find({}, {sort: {time: -1}, limit: 25});
    });

    /**
     * Startup
     */
    Meteor.startup(function () {
        Meteor.call('saveTickets');
        Meteor.call('saveCommits');
    });

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
                    Commits.insert({
                        'revision': json[i].revision_cache.revision,
                        'message': json[i].revision_cache.message,
                        'author': json[i].revision_cache.author,
                        'time': json[i].revision_cache.time
                    });
                }
            });
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
