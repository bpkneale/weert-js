/*
 * Copyright (c) 2015-2016 Tom Keffer <tkeffer@gmail.com>
 *
 *  See the file LICENSE for your full rights.
 */

/*
 * Test spec for testing the POSTing of packets to a stream.
 */
"use strict";

var async = require('async');
var frisby = require('frisby');
var normalizeUrl = require('normalize-url');
var request = require('request');

var config = require('../../server/config');

var test_url = 'http://localhost:3000' + config.server.api + '/measurements';
var packets_url = test_url + '/test_measurement/packets';

var timestamp = function (i) {
    // Base time is 1-Jan-2015 0000 UTC:
    return 1420070400000 + i * 300000;
};

var temperature = function (i) {
    return 40 - i;
};

var form_deep_packet = function (i) {
    let obj = {
        timestamp: String(timestamp(i)),
        tags: {platform: 'test_platform'},
        fields: {temperature: temperature(i)}
    };
    return obj;
};

describe('In the single packet tests', function () {

    // Before each test, delete the entire measurement.
    beforeEach(function (doneFn) {
        request({
            url: packets_url,
            method: 'DELETE'
        }, function (err) {
            doneFn();
        });

    });
    it('should POST and GET a single packet', function (doneFn) {
        frisby.post(packets_url, form_deep_packet(0), {json: true})
              .expect('status', 201)
              .then(function (res) {
                  // We've POSTed a packet. Now try to retrieve it. Get the location
                  // out of the returned header
                  var packet_link = res.headers.get('location');
                  // Now retrieve and check the POSTed packet
                  frisby.get(packet_link)
                        .expect('status', 200)
                        .expect('json', form_deep_packet(0));
              })
              .done(doneFn);
    });

    it('should POST and DELETE a packet', function (doneFn) {
        frisby.post(packets_url, form_deep_packet(0), {json: true})
              .expect('status', 201)
              .then(function (res) {
                  // We've POSTed a packet. Now try to delete it. Get the location
                  // out of the returned header
                  var packet_link = res.headers.get('location');
                  // Check its value
                  expect(packet_link).toEqual(packets_url + '/' + timestamp(0));
                  // Now delete it.
                  frisby.del(packet_link)
                        .expect('status', 204)
                        .then(function (res) {
                            // Make sure it's truly deleted. This also tests getting a non-existent packet
                            frisby.get(packet_link)
                                  .expect('status', 404);
                        });

              })
              .done(doneFn);
    });
    
    it('should DELETE a non-existing packet', function (doneFn) {
        let packet_url = packets_url + '/' + timestamp(0);
        // Try deleting a non-existing packet. Should also get a 204
        frisby.del(packet_url)
              .expect('status', 204)
              .done(doneFn);

    });
});


// describe('Malformed packet tests', function () {
//     let no_timestamp_packet = form_deep_packet(0);
//     delete no_timestamp_packet.timestamp;
//     it('Should not POST a packet with no timestamp', function (doneFn) {
//         frisby.post(packets_url, no_timestamp_packet, {json: true})
//               .expect('status', 400)
//               .done(doneFn);
//     });
//
//     let bad_measurement_packet = form_deep_packet(0);
//     bad_measurement_packet.measurement = 'foo';
//     it("Should not POST a packet with a mis-matched value of 'measurement'", function (doneFn) {
//         frisby.post(packets_url, bad_measurement_packet, {json: true})
//               .expect('status', 400)
//               .done(doneFn);
//     });
//
//     // Try it with a good value for 'measurement'
//     let good_measurement_packet = form_deep_packet(0);
//     good_measurement_packet.measurement = 'test_measurement';
//     it("Should POST a packet with a matched value of 'measurement'", function (doneFn) {
//         frisby.post(packets_url, good_measurement_packet, {json: true})
//               .expect('status', 201)
//               .done(doneFn);
//     });
// });

// How many packets to use for the test.
// Must be > 5 for the tests to work.
// var N = 20;
// describe("Launch and test " + N + " POSTs of packets", function () {
//     var query;
//
//     var indices = [];
//     var packets = [];
//     var reverse_packets = [];
//     for (var i = 0; i < N; i++) {
//         indices[i] = i;
//         packets[i] = form_deep_packet(i);
//         reverse_packets[N - i - 1] = packets[i];
//     }
//
//     // This function will return the URI for the specific packet at a given timestamp
//     var time_link = function (timestamp) {
//         return normalizeUrl(packets_url + '/' + timestamp);
//     };
//
//     var results_finished = false;
//     var results_successful = false;
//
//     beforeAll(function (doneFn) {
//
//         // Use the async library to asynchronously launch the N posts
//         async.each(indices, function (i, callback) {
//             request({
//                 url: packets_url,
//                 method: 'POST',
//                 json: packets[i]
//             }, function (error) {
//                 return callback(error);
//             });
//         }, function (err) {
//             // This function is called when finished. Signal that we're finished, and whether
//             // there were any errors
//             results_finished = true;
//             results_successful = !err;
//             doneFn();
//         });
//
//     });
//
//     it("should have launched " + N + " threads", function (doneFn) {
//         console.log("results_successful=", results_successful);
//         expect(results_successful).toBeTruthy();
//         doneFn();
//     });
//
//     console.log('packets_url=', packets_url);
//     it("Retrieve all packets in default order", function (doneFn) {
//         doneFn();
//         // frisby.get(packets_url)
//         //       .expect('status', 200)
//         //       .expect('json', packets)
//         //       .done(doneFn);
//     });
//
//
//     // it("should launch all POSTS", function (doneFn) {
//     //
//     //     // All the async POSTs are done. We can test the results.
//     //     runs(function () {
//     //         expect(results_successful).toBeTruthy();
//     //
//     //         describe('Retrieve the packets in various orders', function () {
//     //             it("Retrieve all packets in default order", function (doneFn) {
//     //                 frisby.get(packets_url)
//     //                       .expect('status', 200)
//     //                       .expect('json', packets)
//     //                       .done(doneFn);
//     //             });
//     //
//     //             // frisby.create("Retrieve all packets in reverse order")
//     //             //     .get(packets_url + '?direction=desc')
//     //             //     .expectStatus(200)
//     //             //     .expectJSONTypes('', Array)
//     //             //     .expectJSON('', reverse_packets)
//     //             //     .toss();
//     //             //
//     //             // frisby.create("Retrieve packets sorted by temperature")
//     //             //     .get(packets_url + '?sort=outside_temperature&direction=asc')
//     //             //     .expectStatus(200)
//     //             //     .expectJSONTypes('', Array)
//     //             //     .expectJSON('', reverse_packets)
//     //             //     .toss();
//     //             //
//     //             // frisby.create("Retrieve packets reverse sorted by temperature")
//     //             //     .get(packets_url + '?sort=outside_temperature&direction=desc')
//     //             //     .expectStatus(200)
//     //             //     .expectJSONTypes('', Array)
//     //             //     .expectJSON('', packets)
//     //             //     .toss();
//     //             //
//     //             // frisby.create("Test packets using bad sort direction")
//     //             //     .get(packets_url + '?direction=foo')
//     //             //     .expectStatus(400)
//     //             //     .toss();
//     //             //
//     //             // frisby.create("Get aggregate_type max")
//     //             //     .get(packets_url + '?aggregate_type=max&obs_type=outside_temperature')
//     //             //     .expectStatus(200)
//     //             //     .afterJSON(function (json) {
//     //             //         expect(json).toEqual(temperature(0));
//     //             //     })
//     //             //     .toss();
//     //             //
//     //             // frisby.create("Get agg_type min value")
//     //             //     .get(packets_url + '?agg_type=min&obs_type=outside_temperature')
//     //             //     .expectStatus(200)
//     //             //     .afterJSON(function (json) {
//     //             //         expect(json).toEqual(temperature(N - 1));
//     //             //     })
//     //             //     .toss();
//     //             //
//     //             // frisby.create("Get min value of a bogus observation type")
//     //             //     .get(packets_url + '?agg_type=min&obs_type=bogus_temperature')
//     //             //     .expectStatus(200)
//     //             //     .afterJSON(function (json) {
//     //             //         expect(json).toEqual(null);
//     //             //     })
//     //             //     .toss();
//     //             //
//     //             // // Test a query. Select only packets where temperature <= the temperature in record 5. Because
//     //             // // temperatures descend with time, this will exclude the first 5 records.
//     //             // // So, there should be N-5 left.
//     //             // query = '&query=' + encodeURIComponent(JSON.stringify({outside_temperature: {$lte: temperature(5)}}));
//     //             // frisby.create("Get packets by value with query")
//     //             //     .get(packets_url + '?as=values&' + query)
//     //             //     .expectStatus(200)
//     //             //     .afterJSON(function (json) {
//     //             //         expect(json).toEqual(packets.slice(5));     // Exclude first 5 records
//     //             //     })
//     //             //     .toss();
//     //             //
//     //             // // Test adding an arbitrary query to the aggregation. In this case, look for the min
//     //             // // temperature in the records restricted to those with temperature >= the temperature
//     //             // // in the N-3 record. Because temperatures are descending with time, this should be
//     //             // // the temperature of the N-3 record
//     //             // query = '&query=' + encodeURIComponent(JSON.stringify({outside_temperature: {$gte: temperature(N - 3)}}));
//     //             // frisby.create("Get aggregate with query")
//     //             //     .get(packets_url + '?agg_type=min&obs_type=outside_temperature' + query)
//     //             //     .expectStatus(200)
//     //             //     .afterJSON(function (json) {
//     //             //         expect(json).toEqual(temperature(N - 3));
//     //             //     })
//     //             //     .toss();
//     //             //
//     //             // frisby.create("Search for last packet")
//     //             //     .get(time_link('latest'))
//     //             //     .expectStatus(200)
//     //             //     .expectJSON('', packets[N - 1])
//     //             //     .after(function (error, res) {
//     //             //         describe("Test that search for last packet", function () {
//     //             //             it("contains the packet link", function () {
//     //             //                 expect(res.headers.location).toEqual(time_link(timestamp(N - 1)));
//     //             //             });
//     //             //         });
//     //             //     })
//     //             //     .toss();
//     //             //
//     //             // frisby.create("Search for default match of a timestamp, which is exact")
//     //             //     .get(time_link(packets[2].timestamp))
//     //             //     .expectStatus(200)
//     //             //     .expectJSON('', packets[2])
//     //             //     .toss();
//     //             //
//     //             // frisby.create("Search for an explicit exact match")
//     //             //     .get(time_link(packets[2].timestamp) + '?match=exact')
//     //             //     .expectStatus(200)
//     //             //     .expectJSON('', packets[2])
//     //             //     .toss();
//     //             //
//     //             // frisby.create("Search for an exact match of a non-existing timestamp")
//     //             //     .get(time_link(packets[2].timestamp - 1) + '?match=exact')
//     //             //     .expectStatus(404)
//     //             //     .toss();
//     //             //
//     //             // frisby.create("Search for lastBefore a timestamp")
//     //             //     .get(time_link(packets[2].timestamp - 1) + '?match=lastBefore')
//     //             //     .expectStatus(200)
//     //             //     .expectJSON('', packets[1])
//     //             //     .after(function (error, res) {
//     //             //         describe("Test that search for lastBefore packet", function () {
//     //             //             it("contains the packet link", function () {
//     //             //                 expect(res.headers.location).toEqual(time_link(timestamp(1)));
//     //             //             });
//     //             //         });
//     //             //     })
//     //             //     .toss();
//     //             //
//     //             // frisby.create("Search for firstAfter a timestamp")
//     //             //     .get(time_link(packets[2].timestamp + 1) + '?match=firstAfter')
//     //             //     .expectStatus(200)
//     //             //     .expectJSON('', packets[3])
//     //             //     .toss();
//     //             //
//     //             // frisby.create("Search for a location using a bad match")
//     //             //     .get(time_link(packets[2].timestamp) + '?match=foo')
//     //             //     .expectStatus(400)
//     //             //     .toss();
//     //         });
//     //     });
//     // });
// });


// testSinglePacket();
// testMultiplePackets();
