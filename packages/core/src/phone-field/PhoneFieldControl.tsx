import React, {RefObject, createRef} from 'react'
import MaskedInput from 'react-text-mask'
import {findDOMNode} from 'react-dom'

import PhoneFieldControlProps from './PhoneFieldControlProps'
import PhoneFieldControlState from './PhoneFieldControlState'

import PhoneFieldCountry from './PhoneFieldCountry'
import {createPhoneMask} from '../mask'

export default class PhoneFieldControl extends React.Component<PhoneFieldControlProps, PhoneFieldControlState> {

  public componentDidUpdate(_props: PhoneFieldControlProps, state: PhoneFieldControlState) {
    if (
      state.selectedCountry &&
      this.state.selectedCountry &&
      state.selectedCountry.mask !== this.state.selectedCountry.mask &&
      this.props.value
    ) {
      const position = this.props.value.length * 2
      this.inputField.setSelectionRange(position, position)
    }
  }

  public state: PhoneFieldControlState = {
    focused: false,
    showCountries: false,
    selectedCountry: null,
    focusedCountry: null,
  }

  private containerRef: RefObject<HTMLDivElement> = createRef()

  private inputRef: RefObject<MaskedInput> = createRef()

  private dropdownRef: RefObject<HTMLDivElement> = createRef()

  private optionsRefs: Map<PhoneFieldCountry, RefObject<HTMLDivElement>> = new Map(
    this.props.countries.map((country => [country, createRef()])),
  )

  private onCountryClick = (country: PhoneFieldCountry) => (event: React.MouseEvent) => {
    event.preventDefault()
    this.selectCountry(country)
  }

  private onCountryEnter = (country: PhoneFieldCountry) => (event: React.MouseEvent) => {
    event.preventDefault()
    this.setState({
      focusedCountry: country,
    })
  }

  private onCountryLeave = () => (event: React.MouseEvent) => {
    event.preventDefault()
    this.setState({
      focusedCountry: null,
    })
  }

  private get inputField(): HTMLInputElement {
    return findDOMNode(this.inputRef.current!) as HTMLInputElement
  }

  private onFlagClick: React.MouseEventHandler = (event: React.MouseEvent) => {
    event.preventDefault()
    this.inputField.focus()
    this.setState({
      showCountries: true,
    })
  }

  private onFlagMouseDown: React.MouseEventHandler = (event: React.MouseEvent) => {
    event.preventDefault()
    this.inputField.focus()
  }

  private selectCountry: (country: PhoneFieldCountry) => void = (country) => {
    const phoneNumber = this.props.value ? this.props.value : ''
    const currentCountryMask = this.state.selectedCountry ? this.clear(this.state.selectedCountry.mask) : ''
    const newCountryMask = this.clear(country.mask)
    if (this.props.onChange) {
      this.props.onChange(
        `+${newCountryMask}${this.clear(phoneNumber).substr(currentCountryMask.length)}`,
        country.code,
      )
    }
    this.inputField.focus()
    this.setState({
      showCountries: false,
      selectedCountry: country,
    })
  }

  private onCountriesHide: () => void = () => {
    this.setState({
      showCountries: false,
    })
  }

  private onChange: React.ChangeEventHandler<HTMLInputElement> = (event: React.ChangeEvent<HTMLInputElement>) => {
    event.preventDefault()
    const country = this.getCountryByPhone(event.currentTarget.value)
    if (this.props.onChange) {
      this.props.onChange(
        event.currentTarget.value,
        country ? country.code : undefined,
      )
    }
    this.setState({
      selectedCountry: country ? country : null,
    })
  }

  private onFocus: React.FocusEventHandler = (event: React.FocusEvent) => {
    event.preventDefault()
    this.setState({
      focused: true,
    })
    if (this.props.onFocus) {
      this.props.onFocus()
    }
  }

  private onBlur: React.FocusEventHandler = (event: React.FocusEvent) => {
    event.preventDefault()
    this.setState({
      focused: false,
    })
    if (this.props.hideOnBlur) {
      this.setState({
        showCountries: false,
      })
    }
    if (this.props.onBlur) {
      this.props.onBlur()
    }
  }

  private onKeyDown: React.KeyboardEventHandler = (event: React.KeyboardEvent) => {
    if (!this.state.showCountries && (event.key === 'ArrowDown' || event.key === 'ArrowUp')) {
      event.preventDefault()
      this.setState({
        showCountries: true,
      })
      return
    }
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      this.setState({
        focusedCountry: this.nextCountry,
      })
      const countryRef = this.optionsRefs.get(this.nextCountry || this.state.selectedCountry || this.props.countries[0])
      if (countryRef && this.dropdownRef) {
        this.scrollToCountry(countryRef)
      }
      return
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault()
      this.setState({
        focusedCountry: this.prevCountry,
      })
      const countryRef = this.optionsRefs.get(this.prevCountry || this.state.selectedCountry || this.props.countries[0])
      if (countryRef && this.dropdownRef) {
        this.scrollToCountry(countryRef)
      }
      return
    }
    if (this.state.showCountries && event.key === 'Enter') {
      event.preventDefault()
      this.selectCountry(this.state.focusedCountry || this.state.selectedCountry || this.props.countries[0])
    }
  }

  private clear(value: string): string {
    return value.replace(/\D/g, '')
  }

  private scrollToCountry: (country: RefObject<HTMLDivElement>) => void = (country) => {
    const dropdownElement = findDOMNode(this.dropdownRef.current) as HTMLDivElement
    const countryElement = findDOMNode(country.current) as HTMLDivElement
    const containerBoundingRect = dropdownElement.getBoundingClientRect()
    const countryBoundingRect = countryElement.getBoundingClientRect()
    const countryOffset = countryElement.offsetTop
    const scrollOffset = dropdownElement.scrollTop
    const countryHeigher = countryOffset < scrollOffset
    const countryLower = countryOffset + countryBoundingRect.height > scrollOffset + containerBoundingRect.height
    if (countryHeigher) {
      dropdownElement.scrollTo({top: countryOffset})
    }
    if (countryLower) {
      dropdownElement.scrollTo({top: countryOffset + countryBoundingRect.height - containerBoundingRect.height})
    }
  }

  private getCountryByPhone(phoneNumber: string): PhoneFieldCountry | undefined {
    const clearPhone = this.clear(phoneNumber)
    return this.props.countries
      .slice(0)
      .sort((a, b) => this.clear(b.mask).length - this.clear(a.mask).length)
      .find((option) => clearPhone.indexOf(this.clear(option.mask)) === 0)
  }

  private get nextCountry(): PhoneFieldCountry | null {
    const {countries} = this.props
    const focusedId: number = countries.findIndex(country => this.state.focusedCountry === null ? country === this.state.selectedCountry : country === this.state.focusedCountry)
    const nextId = focusedId + 1 >= countries.length ? 0 : focusedId + 1
    return countries[nextId]
  }

  private get prevCountry(): PhoneFieldCountry | null {
    const {countries} = this.props
    const focusedId: number = countries.findIndex(country => this.state.focusedCountry === null ? country === this.state.selectedCountry : country === this.state.focusedCountry)
    const prevId = focusedId <= 0 ? countries.length - 1 : focusedId - 1
    return countries[prevId]
  }

  public render() {
    return this.props.children({
      value: this.props.value || '',
      code: this.state.selectedCountry ? this.state.selectedCountry.code : undefined,
      countries: this.props.countries.map((country) => ({
        ...country,
        ref: this.optionsRefs.get(country)!,
        selected: country === this.state.selectedCountry,
        focused: country === this.state.focusedCountry,
        onClick: this.onCountryClick(country),
        onMouseEnter: this.onCountryEnter(country),
        onMouseLeave: this.onCountryLeave(),
      })),
      focused: this.state.focused,
      showCountries: this.state.showCountries,
      containerRef: this.containerRef,
      inputRef: this.inputRef,
      dropdownRef: this.dropdownRef,
      mask: createPhoneMask(this.props.countries.map(country => country.mask)),
      onFlagClick: this.onFlagClick,
      onFlagMouseDown: this.onFlagMouseDown,
      onCountriesHide: this.onCountriesHide,
      onChange: this.onChange,
      onFocus: this.onFocus,
      onBlur: this.onBlur,
      onKeyDown: this.onKeyDown,
    })
  }

}
