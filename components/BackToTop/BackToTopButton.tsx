'use client';
import { Component } from 'react';
import './BackToTop.scss';
import { goToTop } from '../Helper';

class BackToTop extends Component {
    render() {
        return (
            <button id="back-to-top-button" className="back-to-top-button" onClick={ goToTop }>
                ^
            </button>
        );
    }
}

export default BackToTop;