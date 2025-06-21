// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

contract EventContract is Ownable {
    struct Event {
        uint256 id;
        string name;
        string description;
        uint256 date;
        string venue;
        address[] speakers;
        bool isActive;
    }

    Event[] public events;
    mapping(uint256 => address[]) public eventSpeakers;

    event EventCreated(uint256 indexed eventId, string name, uint256 date);
    event SpeakerAdded(uint256 indexed eventId, address indexed speaker);

    constructor() Ownable(msg.sender) {}

    function createEvent(
        string memory _name,
        string memory _description,
        uint256 _date,
        string memory _venue
    ) external onlyOwner {
        uint256 eventId = events.length;
        events.push(Event(eventId, _name, _description, _date, _venue, new address[](0), true));
        emit EventCreated(eventId, _name, _date);
    }

    function addSpeaker(uint256 _eventId, address _speaker) external onlyOwner {
        require(_eventId < events.length, "Event does not exist");
        eventSpeakers[_eventId].push(_speaker);
        emit SpeakerAdded(_eventId, _speaker);
    }

    function getEvent(uint256 _eventId) external view returns (Event memory) {
        require(_eventId < events.length, "Event does not exist");
        return events[_eventId];
    }

    function getSpeakers(uint256 _eventId) external view returns (address[] memory) {
        require(_eventId < events.length, "Event does not exist");
        return eventSpeakers[_eventId];
    }

    function getAllEvents() external view returns (Event[] memory) {
        return events;
    }
}